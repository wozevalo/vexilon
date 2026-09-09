'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Film } from 'lucide-react';
import Image from 'next/image';
import { EventMedia } from '@/lib/types';
import { toEmbedUrl, embedThumbnail, embedPlatform } from '@/lib/media';

interface EventGalleryProps {
  media: EventMedia[];
  /** Domaine courant — requis par Twitch pour autoriser l'intégration */
  host?: string;
}

interface GalleryItem {
  id: string;
  kind: 'image' | 'video' | 'embed';
  /** Fichier local (image, vidéo) ou URL d'intégration résolue */
  src: string;
  caption?: string;
  /** Vignette d'aperçu des intégrations, quand la plateforme en fournit une */
  poster?: string;
  /** Nom de la plateforme, affiché sur le badge des intégrations */
  platform?: string;
}

/** Secondes → « 4:07 » */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  return minutes + ':' + String(total % 60).padStart(2, '0');
}

/** Ajoute autoplay=1 à une URL d'intégration */
function withAutoplay(url: string): string {
  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'autoplay=1';
}

export default function EventGallery({ media, host }: EventGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [durations, setDurations] = useState<Record<string, string>>({});

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  /* ── Normalisation : un seul format pour la grille et la visionneuse ── */
  const items: GalleryItem[] = [];
  const unresolved: EventMedia[] = [];

  for (const entry of media || []) {
    if (entry.type === 'embed') {
      const embedUrl = entry.url ? toEmbedUrl(entry.url, host) : null;
      // Plateforme non reconnue : rendue plus bas en simple lien cliquable
      if (!embedUrl || !entry.url) {
        unresolved.push(entry);
        continue;
      }
      items.push({
        id: entry.id,
        kind: 'embed',
        src: embedUrl,
        caption: entry.caption,
        poster: embedThumbnail(entry.url) || undefined,
        platform: embedPlatform(entry.url),
      });
      continue;
    }

    if (!entry.path) continue;
    items.push({
      id: entry.id,
      kind: entry.type === 'video' ? 'video' : 'image',
      src: entry.path,
      caption: entry.caption,
    });
  }

  /* ── Navigation de la visionneuse ─────────────────────────────────── */

  const close = useCallback(() => setOpenIndex(null), []);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? current : (current + delta + items.length) % items.length
      ),
    [items.length]
  );

  const open = (index: number) => {
    lastFocused.current = document.activeElement as HTMLElement;
    setOpenIndex(index);
  };

  // Clavier + blocage du défilement de la page pendant l'ouverture
  useEffect(() => {
    if (openIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'ArrowRight') step(1);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  // Rend le focus à la vignette d'origine à la fermeture
  useEffect(() => {
    if (openIndex === null && lastFocused.current) {
      lastFocused.current.focus();
      lastFocused.current = null;
    }
  }, [openIndex]);

  if (items.length === 0 && unresolved.length === 0) return null;

  const current = openIndex === null ? null : items[openIndex];

  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between gap-6 mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Galerie</h2>
        {items.length > 1 && (
          <span className="text-xs text-gray-400 dark:text-gray-600">Cliquez pour agrandir</span>
        )}
      </div>

      {/* ── Grille ─────────────────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => open(index)}
            aria-label={
              (item.kind === 'image' ? 'Agrandir la photo' : 'Lire la vidéo') +
              (item.caption ? ' : ' + item.caption : '')
            }
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0F1A] text-left transition-all duration-300 hover:-translate-y-1 hover:border-vexilon-primary hover:shadow-lg hover:shadow-gray-900/10 dark:hover:shadow-[0_0_26px_rgba(188,19,254,0.28)]"
          >
            {/* Visuel */}
            <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-black">
              {item.kind === 'image' && (
                <Image
                  src={item.src}
                  alt={item.caption || ''}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              {item.kind === 'video' && (
                // #t=0.4 : le navigateur affiche la première image du fichier,
                // ce qui évite d'avoir à téléverser une image de couverture.
                <video
                  src={item.src + '#t=0.4'}
                  preload="metadata"
                  muted
                  playsInline
                  onLoadedMetadata={(event) => {
                    const value = formatDuration(event.currentTarget.duration);
                    if (value) setDurations((prev) => ({ ...prev, [item.id]: value }));
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              {item.kind === 'embed' &&
                (item.poster ? (
                  <Image
                    src={item.poster}
                    alt={item.caption || ''}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  // Plateformes sans vignette publique (Twitch, Vimeo…)
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#12061c] dark:to-black">
                    <Film className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                  </div>
                ))}

              {/* Les médias lisibles sont assombris pour faire ressortir le bouton */}
              {item.kind !== 'image' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid place-items-center w-12 h-12 rounded-full border border-white/50 bg-black/45 text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-vexilon-primary group-hover:border-vexilon-primary group-hover:shadow-[0_0_30px_rgba(188,19,254,0.55)]">
                      <Play className="w-4 h-4 translate-x-[1px]" fill="currentColor" />
                    </span>
                  </div>
                </>
              )}

              {/* Badge de type */}
              {item.kind !== 'image' && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-vexilon-primary text-white shadow-[0_0_16px_rgba(188,19,254,0.45)]">
                  {item.kind === 'video' ? 'Vidéo' : item.platform}
                </span>
              )}

              {/* Durée réelle, lue dans les métadonnées du fichier */}
              {durations[item.id] && (
                <span className="absolute bottom-3 right-3 px-1.5 py-0.5 rounded bg-black/75 text-white text-[11px] font-semibold tabular-nums">
                  {durations[item.id]}
                </span>
              )}
            </div>

            {/* Légende */}
            {item.caption && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.caption}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Intégrations dont la plateforme n'est pas reconnue */}
      {unresolved.length > 0 && (
        <ul className="mt-6 space-y-2">
          {unresolved.map((entry) => (
            <li key={entry.id}>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-vexilon-primary text-sm break-all hover:underline"
              >
                {entry.caption || entry.url}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* ── Visionneuse ────────────────────────────────────────────── */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || 'Média agrandi'}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          className="fixed inset-0 z-[100] grid place-items-center px-4 py-16 sm:px-12 bg-black/95 backdrop-blur-md"
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute top-5 right-5 grid place-items-center w-11 h-11 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-vexilon-primary hover:border-vexilon-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Média précédent"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-vexilon-primary hover:border-vexilon-primary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Média suivant"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-vexilon-primary hover:border-vexilon-primary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="w-full max-w-5xl">
            {/* Cadre : liseré blanc discret dans les deux thèmes, sans halo. */}
            <div className="relative w-full aspect-video max-h-[74vh] overflow-hidden rounded-xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.3)]">
              {/* La clé force le remontage : sans elle, changer de média
                  réutiliserait le lecteur précédent et sa lecture en cours. */}
              {current.kind === 'image' && (
                <Image
                  key={current.id}
                  src={current.src}
                  alt={current.caption || ''}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}

              {current.kind === 'video' && (
                <video
                  key={current.id}
                  src={current.src}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {current.kind === 'embed' && (
                <iframe
                  key={current.id}
                  src={withAutoplay(current.src)}
                  title={current.caption || 'Vidéo'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-6 mt-4 flex-wrap">
              <p className="text-sm text-gray-300">{current.caption}</p>
              {items.length > 1 && (
                <span className="font-display text-xs tracking-[0.2em] text-gray-500 tabular-nums">
                  {String((openIndex ?? 0) + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
