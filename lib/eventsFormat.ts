import { VexEvent } from './types';

/**
 * Fuseau fixé pour que le rendu serveur et le rendu client soient identiques
 * (sinon React signale une différence d'hydratation sur les dates).
 */
const TIME_ZONE = 'Europe/Paris';

function safeDate(iso?: string): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDay(iso?: string): string {
  const date = safeDate(iso);
  if (!date) return '';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

export function formatTime(iso?: string): string {
  const date = safeDate(iso);
  if (!date) return '';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });
}

/** « 17 octobre 2026 » ou « du 17 au 18 octobre 2026 » */
export function formatEventDate(event: Pick<VexEvent, 'startDate' | 'endDate'>): string {
  const start = safeDate(event.startDate);
  if (!start) return '';
  const end = safeDate(event.endDate);

  if (!end) return formatDay(event.startDate);

  const sameDay = formatDay(event.startDate) === formatDay(event.endDate);
  if (sameDay) return formatDay(event.startDate);

  return 'du ' + formatDay(event.startDate) + ' au ' + formatDay(event.endDate);
}

/** Badge court pour les cartes : « 17 oct. 2026 » */
export function formatShortDate(iso?: string): string {
  const date = safeDate(iso);
  if (!date) return '';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

/** Jour et mois séparés, pour la pastille « calendrier » des cartes */
export function splitDayMonth(iso?: string): { day: string; month: string } {
  const date = safeDate(iso);
  if (!date) return { day: '', month: '' };
  return {
    day: date.toLocaleDateString('fr-FR', { day: '2-digit', timeZone: TIME_ZONE }),
    month: date
      .toLocaleDateString('fr-FR', { month: 'short', timeZone: TIME_ZONE })
      .replace('.', '')
      .toUpperCase(),
  };
}
