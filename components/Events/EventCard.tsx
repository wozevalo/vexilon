import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { VexEvent } from '@/lib/types';
import { formatEventDate, splitDayMonth } from '@/lib/eventsFormat';

interface EventCardProps {
  event: VexEvent;
  status: 'upcoming' | 'past';
}

export default function EventCard({ event, status }: EventCardProps) {
  const { day, month } = splitDayMonth(event.startDate);
  const isPast = status === 'past';

  return (
    <Link
      href={'/evenements/' + event.slug}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0F1A] hover:border-vexilon-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/10 dark:hover:shadow-[0_0_34px_rgba(188,19,254,0.25)]"
    >
      {/* Visuel */}
      <div
        className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-900"
        style={event.coverColor ? { backgroundColor: event.coverColor } : undefined}
      >
        {event.coverPath ? (
          <Image
            src={event.coverPath}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className={
              'object-cover transition-transform duration-700 group-hover:scale-105 ' +
              (isPast ? 'grayscale-[0.4] group-hover:grayscale-0' : '')
            }
          />
        ) : event.coverColor ? null : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-700" />
          </div>
        )}

        {/* Voile de lisibilité : seulement s'il y a une image dessous,
            sinon il assombrit inutilement la case vide en thème clair. */}
        {(event.coverPath || event.coverColor) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        )}

        {/* Pastille date */}
        <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-black/75 backdrop-blur-md border border-white/15">
          <span className="text-lg font-display font-bold leading-none text-white">{day}</span>
          <span className="text-[10px] font-bold tracking-widest text-vexilon-primary">{month}</span>
        </div>

        {/* Statut */}
        <span
          className={
            'absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ' +
            (isPast
              ? 'bg-black/60 border-white/10 text-gray-300'
              : 'bg-vexilon-primary/90 border-vexilon-primary text-white')
          }
        >
          {isPast ? 'Terminé' : 'À venir'}
        </span>
      </div>

      {/* Contenu */}
      <div className="flex flex-col flex-1 p-6">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-3">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" />
            {formatEventDate(event)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
        </p>

        <h3 className="text-lg md:text-xl font-display font-bold text-gray-900 dark:text-white leading-tight group-hover:text-vexilon-primary transition-colors">
          {event.title}
        </h3>

        <div className="w-10 h-0.5 bg-vexilon-primary my-4" />

        {event.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
            {event.excerpt}
          </p>
        )}

        <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-vexilon-primary">
          Voir l&apos;événement
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
