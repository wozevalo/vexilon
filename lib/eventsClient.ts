import { VexEvent } from './types';

export interface EventPayload {
  title: string;
  description: string;
  excerpt?: string;
  coverPath?: string;
  coverColor?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  status: VexEvent['status'];
  ctaLabel?: string;
  ctaUrl?: string;
  media: VexEvent['media'];
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.error === 'string' ? data.error : fallback;
  } catch {
    return fallback;
  }
}

/** Liste des événements (ordre back-office si `adminOrder`) */
export async function fetchEvents(adminOrder = false): Promise<VexEvent[]> {
  const res = await fetch('/api/events' + (adminOrder ? '?all=1' : ''), { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createEvent(payload: EventPayload): Promise<VexEvent> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "La création de l'événement a échoué."));
  return res.json();
}

export async function updateEvent(id: string, payload: EventPayload): Promise<VexEvent> {
  const res = await fetch('/api/events/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, 'La mise à jour a échoué.'));
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch('/api/events/' + id, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readError(res, 'La suppression a échoué.'));
}

/** Envoie un fichier et renvoie son chemin public + son type */
export async function uploadFile(file: File): Promise<{ path: string; type: 'image' | 'video' }> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/uploads', { method: 'POST', body: form });
  if (!res.ok) throw new Error(await readError(res, "L'envoi du fichier a échoué."));
  return res.json();
}
