import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join, normalize, sep } from 'path';

/**
 * Le dossier public/uploads est partagé par les publications du blog ET par les
 * événements. Un fichier ne doit donc être effacé du disque que si plus AUCUN
 * des deux ne le référence — sinon supprimer un événement casserait l'affiche
 * d'un article (et inversement).
 */

const PUBLIC_PATH = join(process.cwd(), 'public');
const EVENTS_PATH = join(process.cwd(), 'data', 'events.json');
const ARTICLES_PATH = join(process.cwd(), 'data', 'articles.json');

function readJsonArray(path: string): Record<string, unknown>[] {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Extrait les chemins /uploads cités dans du HTML (src="…" ou href="…") */
function extractHtmlPaths(html: unknown): string[] {
  if (typeof html !== 'string') return [];
  const paths: string[] = [];
  const regex = /(?:src|href)="(\/uploads\/[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

/** Forme minimale acceptée : un VexEvent comme un objet brut relu du JSON */
interface EventLike {
  coverPath?: unknown;
  media?: unknown;
  description?: unknown;
}

/** Tous les fichiers /uploads référencés par un événement */
export function collectEventUploads(event: EventLike): string[] {
  const paths: string[] = [];

  if (typeof event.coverPath === 'string') paths.push(event.coverPath);

  if (Array.isArray(event.media)) {
    for (const item of event.media) {
      if (item && typeof item === 'object' && typeof (item as { path?: unknown }).path === 'string') {
        paths.push((item as { path: string }).path);
      }
    }
  }

  paths.push(...extractHtmlPaths(event.description));

  return paths.filter((path) => path.startsWith('/uploads/'));
}

/** L'ensemble des fichiers /uploads actuellement utilisés (événements + articles) */
export function collectUsedUploads(): Set<string> {
  const used = new Set<string>();

  for (const event of readJsonArray(EVENTS_PATH)) {
    for (const path of collectEventUploads(event)) used.add(path);
  }

  for (const article of readJsonArray(ARTICLES_PATH)) {
    if (typeof article.imagePath === 'string' && article.imagePath.startsWith('/uploads/')) {
      used.add(article.imagePath);
    }
    for (const path of extractHtmlPaths(article.content)) used.add(path);
  }

  return used;
}

/**
 * Supprime du disque les fichiers passés en paramètre qui ne sont plus
 * référencés. À appeler APRÈS avoir écrit le fichier JSON mis à jour.
 */
export function deleteUploadsIfUnused(paths: string[]) {
  if (paths.length === 0) return;
  const used = collectUsedUploads();

  for (const path of new Set(paths)) {
    if (!path.startsWith('/uploads/') || used.has(path)) continue;

    const absolute = normalize(join(PUBLIC_PATH, path));
    // Garde-fou : ne jamais sortir de /public. Le séparateur final est
    // indispensable — sans lui, un dossier voisin nommé « public-xyz »
    // passerait le test de préfixe.
    if (!absolute.startsWith(normalize(PUBLIC_PATH) + sep)) continue;
    if (!existsSync(absolute)) continue;

    try {
      unlinkSync(absolute);
    } catch {
      /* fichier verrouillé ou déjà supprimé — sans conséquence */
    }
  }
}
