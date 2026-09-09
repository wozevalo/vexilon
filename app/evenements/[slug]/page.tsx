import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/Layout/SiteHeader';
import { headers } from 'next/headers';
import { CalendarDays, Clock, MapPin, ExternalLink } from 'lucide-react';
import { findEvent, getAllEvents, resolveStatus } from '@/lib/eventsStore';
import { htmlToText } from '@/lib/sanitizeHtml';
import { jsonLdScript } from '@/lib/jsonLd';
import Image from 'next/image';
import { fixTwitchParents } from '@/lib/media';
import { formatEventDate, formatTime } from '@/lib/eventsFormat';
import EventGallery from '@/components/Events/EventGallery';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const event = findEvent(params.slug);
  if (!event) return { title: 'Événement introuvable' };

  const description = event.excerpt || htmlToText(event.description, 160) || undefined;

  return {
    title: event.title,
    description,
    alternates: { canonical: '/evenements/' + event.slug },
    openGraph: {
      type: 'article',
      title: event.title + ' | VEXILON ESPORT',
      description,
      url: '/evenements/' + event.slug,
      images: event.coverPath ? [{ url: event.coverPath, alt: event.title }] : undefined,
    },
  };
}

export default function EvenementDetailPage({ params }: PageProps) {
  const event = findEvent(params.slug);
  if (!event) notFound();

  const host = headers().get('host') || undefined;
  const status = resolveStatus(event);
  const isPast = status === 'past';
  const description = fixTwitchParents(event.description || '', host);

  // Deux autres événements à suggérer en bas de page
  const others = getAllEvents()
    .filter((item) => item.id !== event.id)
    .slice(0, 2);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.startDate,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.location ? { location: { '@type': 'Place', name: event.location } } : {}),
    ...(event.excerpt ? { description: event.excerpt } : {}),
    organizer: { '@type': 'Organization', name: 'Vexilon Esport' },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />

      <SiteHeader />

      {/* ── Bandeau de couverture ───────────────────────────────────── */}
      <header className="relative">
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <div
            className="relative w-full overflow-hidden rounded-2xl bg-[#0B0F1A] min-h-[240px] md:min-h-[420px] flex items-end"
            style={event.coverColor && !event.coverPath ? { backgroundColor: event.coverColor } : undefined}
          >
            {event.coverPath && (
              <Image
                src={event.coverPath}
                alt={event.title}
                fill
                priority
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

            <div className="relative w-full p-6 md:p-12">
              <span
                className={
                  'inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md mb-5 ' +
                  (isPast
                    ? 'bg-black/60 border-white/20 text-gray-200'
                    : 'bg-vexilon-primary/90 border-vexilon-primary text-white')
                }
              >
                {isPast ? 'Événement terminé' : 'Événement à venir'}
              </span>

              <h1
                className="font-display font-bold uppercase leading-none text-white"
                style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', textShadow: '0 2px 40px rgba(0,0,0,0.6)' }}
              >
                {event.title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* ── Informations pratiques ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pb-8 mb-10 border-b border-gray-200 dark:border-gray-800">
          <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <CalendarDays className="w-4 h-4 text-vexilon-primary" />
            {formatEventDate(event)}
          </span>
          <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4 text-vexilon-primary" />
            {formatTime(event.startDate)}
            {event.endDate && ' – ' + formatTime(event.endDate)}
          </span>
          {event.location && (
            <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-vexilon-primary" />
              {event.location}
            </span>
          )}
        </div>

        {/* ── Description ───────────────────────────────────────────── */}
        {description ? (
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          event.excerpt && (
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{event.excerpt}</p>
          )
        )}

        {/* ── Bouton d'action ───────────────────────────────────────── */}
        {event.ctaUrl && (
          <div className="mt-12">
            <a
              href={event.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-vexilon-primary text-white font-bold uppercase tracking-widest text-sm px-8 py-4 hover:bg-vexilon-primary/80 transition-colors"
            >
              {event.ctaLabel || 'En savoir plus'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* ── Galerie ───────────────────────────────────────────────── */}
        <EventGallery media={event.media} host={host} />

        {/* ── Autres événements ─────────────────────────────────────── */}
        {others.length > 0 && (
          <section className="mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">
              Autres événements
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {others.map((item) => (
                <Link
                  key={item.id}
                  href={'/evenements/' + item.slug}
                  className="group flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-vexilon-primary transition-colors"
                >
                  <div
                    className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900"
                    style={item.coverColor && !item.coverPath ? { backgroundColor: item.coverColor } : undefined}
                  >
                    {item.coverPath ? (
                      <Image
                        src={item.coverPath}
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : item.coverColor ? null : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-gray-400 dark:text-gray-700" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-vexilon-primary transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatEventDate(item)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
