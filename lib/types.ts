export interface Article {
  id: string;
  title: string;
  content?: string;
  imagePath: string; // path relative to /public, e.g. /uploads/uuid.jpg
  publishedAt: string;
}

/* ── Événements ──────────────────────────────────────────────────────── */

export type EventMediaType = 'image' | 'video' | 'embed';

export interface EventMedia {
  id: string;
  type: EventMediaType;
  /** Chemin local sous /public (upload image ou vidéo), ex: /uploads/uuid.mp4 */
  path?: string;
  /** URL externe (YouTube / Twitch / Vimeo / Dailymotion) pour type = 'embed' */
  url?: string;
  caption?: string;
}

/** 'auto' = déduit des dates, sinon forcé par l'admin */
export type EventStatus = 'auto' | 'upcoming' | 'past';

export interface VexEvent {
  id: string;
  slug: string;
  title: string;
  /** HTML riche (assaini côté serveur) produit par l'éditeur du back-office */
  description: string;
  /** Résumé texte brut affiché sur les cartes et dans les meta */
  excerpt?: string;
  /** Couverture en image. Prioritaire sur coverColor si les deux sont là. */
  coverPath?: string;
  /** Couverture en aplat de couleur, au format #rrggbb */
  coverColor?: string;
  location?: string;
  /** ISO date-time */
  startDate: string;
  /** ISO date-time (optionnel, pour les événements sur plusieurs jours) */
  endDate?: string;
  status: EventStatus;
  ctaLabel?: string;
  ctaUrl?: string;
  media: EventMedia[];
  createdAt: string;
  updatedAt: string;
}

/** Champs acceptés à la création / mise à jour d'un événement */
export type EventInput = Omit<VexEvent, 'id' | 'slug' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<VexEvent, 'slug'>>;
