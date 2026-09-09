'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { VexEvent } from '@/lib/types';
import EventCard from './EventCard';

interface EventsBrowserProps {
  upcoming: VexEvent[];
  past: VexEvent[];
}

type Tab = 'upcoming' | 'past';

export default function EventsBrowser({ upcoming, past }: EventsBrowserProps) {
  // Si aucun événement à venir, on ouvre directement sur les événements passés
  const [tab, setTab] = useState<Tab>(upcoming.length === 0 && past.length > 0 ? 'past' : 'upcoming');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'À venir', count: upcoming.length },
    { key: 'past', label: 'Passés', count: past.length },
  ];

  const events = tab === 'upcoming' ? upcoming : past;

  return (
    <>
      {/* Onglets */}
      <div className="flex justify-center mb-14">
        <div className="inline-flex items-center gap-1 p-1 rounded-full border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
          {tabs.map((item) => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={
                  'px-5 sm:px-7 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ' +
                  (isActive
                    ? 'bg-vexilon-primary text-white shadow-md shadow-vexilon-primary/25 dark:shadow-[0_0_20px_rgba(188,19,254,0.35)]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')
                }
              >
                {item.label}
                <span className={'ml-2 ' + (isActive ? 'text-white/70' : 'text-gray-400 dark:text-gray-600')}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-5" />
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            {tab === 'upcoming'
              ? 'Aucun événement programmé pour le moment. Revenez très vite !'
              : 'Aucun événement passé à afficher.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} status={tab} />
          ))}
        </div>
      )}
    </>
  );
}
