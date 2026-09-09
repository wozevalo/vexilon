import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { VexEvent, EventMedia, EventStatus } from './types';
import { sanitizeHtml, htmlToText } from './sanitizeHtml';
import { collectEventUploads, deleteUploadsIfUnused } from './uploadsUsage';
import { writeJsonAtomic } from './jsonFile';

const DATA_PATH = join(process.cwd(), 'data', 'events.json');

/* ── Lecture / écriture du fichier ───────────────────────────────────── */

export function readEvents(): VexEvent[] {
  if (!existsSync(DATA_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: VexEvent[]) {
  writeJsonAtomic(DATA_PATH, events);
}

/* ── Slug ─────────────────────────────────────────────────────────────── */
export function slugify(value: string): string {
  // NFD sépare les accents de leur lettre : on retire ensuite les diacritiques
  // (U+0300 à U+036F) pour que "événement" donne bien "evenement".
  const withoutAccents = Array.from(value.normalize("NFD"))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join("");

  return withoutAccents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function uniqueSlug(title: string, events: VexEvent[], ignoreId?: string): string {
  const base = slugify(title) || 'evenement';
  let slug = base;
  let n = 2;
  while (events.some((e) => e.slug === slug && e.id !== ignoreId)) {
    slug = base + '-' + n++;
  }
  return slug;
}

/* ── Statut ───────────────────────────────────────────────────────────── */

/** Résout le statut réel : 'auto' est déduit de la date de fin (ou de début). */
export function resolveStatus(event: VexEvent, now = new Date()): 'upcoming' | 'past' {
  if (event.status === 'upcoming' || event.status === 'past') return event.status;
  const reference = event.endDate || event.startDate;
  const date = new Date(reference);
  if (Number.isNaN(date.getTime())) return 'upcoming';
  // Un événement sans heure de fin reste « à venir » jusqu'à la fin de sa journée
  if (!event.endDate) date.setHours(23, 59, 59, 999);
  return date.getTime() >= now.getTime() ? 'upcoming' : 'past';
}

/* ── Requêtes ─────────────────────────────────────────────────────────── */

/** Tous les événements : les prochains d'abord (date croissante), puis les passés (date décroissante). */
export function getAllEvents(): VexEvent[] {
  const events = readEvents();
  const now = new Date();
  const upcoming = events
    .filter((e) => resolveStatus(e, now) === 'upcoming')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const past = events
    .filter((e) => resolveStatus(e, now) === 'past')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return [...upcoming, ...past];
}

/** Ordre du back-office : le plus récemment modifié en premier */
export function getEventsForAdmin(): VexEvent[] {
  return readEvents().sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

export function findEvent(idOrSlug: string): VexEvent | undefined {
  const events = readEvents();
  return events.find((e) => e.id === idOrSlug) || events.find((e) => e.slug === idOrSlug);
}

/* ── Normalisation des entrées ───────────────────────────────────────── */

const STATUSES: EventStatus[] = ['auto', 'upcoming', 'past'];

function toIsoOrEmpty(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function cleanText(value: unknown, maxLength = 300): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, maxLength);
  return text || undefined;
}

/** Un chemin média doit rester sous /uploads ou /img pour ne pas sortir de /public */
function cleanLocalPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const path = value.trim();
  if (!/^\/(uploads|img)\/[A-Za-z0-9._-]+$/.test(path)) return undefined;
  return path;
}

/** Couleur de couverture : uniquement une notation hexadécimale complète */
function cleanHexColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const color = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(color) ? color : undefined;
}

function cleanUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const url = value.trim();
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url.slice(0, 500) : undefined;
}

function normalizeMedia(raw: unknown): EventMedia[] {
  if (!Array.isArray(raw)) return [];
  const media: EventMedia[] = [];

  for (const item of raw.slice(0, 40)) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const type = entry.type === 'video' ? 'video' : entry.type === 'embed' ? 'embed' : 'image';
    const caption = cleanText(entry.caption, 200);

    if (type === 'embed') {
      const url = cleanUrl(entry.url);
      if (!url) continue;
      media.push({ id: typeof entry.id === 'string' ? entry.id : randomUUID(), type, url, caption });
      continue;
    }

    const path = cleanLocalPath(entry.path);
    if (!path) continue;
    media.push({ id: typeof entry.id === 'string' ? entry.id : randomUUID(), type, path, caption });
  }

  return media;
}

/** Valide et nettoie les champs envoyés par le back-office. */
export function normalizeEventInput(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const startDate = toIsoOrEmpty(body.startDate);
  const endDate = toIsoOrEmpty(body.endDate);
  const description = sanitizeHtml(typeof body.description === 'string' ? body.description : '');
  const status = STATUSES.includes(body.status as EventStatus) ? (body.status as EventStatus) : 'auto';

  return {
    title,
    startDate,
    endDate: endDate || undefined,
    description,
    excerpt: cleanText(body.excerpt, 300) || htmlToText(description, 200) || undefined,
    coverPath: cleanLocalPath(body.coverPath),
    coverColor: cleanHexColor(body.coverColor),
    location: cleanText(body.location, 160),
    ctaLabel: cleanText(body.ctaLabel, 60),
    ctaUrl: cleanUrl(body.ctaUrl),
    status,
    media: normalizeMedia(body.media),
  };
}

/* ── Écritures ────────────────────────────────────────────────────────── */

export function createEvent(body: Record<string, unknown>): VexEvent {
  const input = normalizeEventInput(body);
  const events = readEvents();
  const now = new Date().toISOString();

  const event: VexEvent = {
    id: randomUUID(),
    slug: uniqueSlug(input.title, events),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  events.push(event);
  writeEvents(events);
  return event;
}

export function updateEvent(id: string, body: Record<string, unknown>): VexEvent | null {
  const events = readEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const previous = events[index];
  const input = normalizeEventInput(body);

  const updated: VexEvent = {
    ...previous,
    ...input,
    slug: previous.title === input.title ? previous.slug : uniqueSlug(input.title, events, id),
    updatedAt: new Date().toISOString(),
  };

  events[index] = updated;
  writeEvents(events);

  // Supprime les fichiers que cet événement ne référence plus
  const stillHere = collectEventUploads(updated);
  deleteUploadsIfUnused(collectEventUploads(previous).filter((p) => !stillHere.includes(p)));

  return updated;
}

export function deleteEvent(id: string): boolean {
  const events = readEvents();
  const event = events.find((e) => e.id === id);
  if (!event) return false;

  writeEvents(events.filter((e) => e.id !== id));
  deleteUploadsIfUnused(collectEventUploads(event));
  return true;
}
