import type { Metadata } from 'next';
import { getAllEvents, resolveStatus } from '@/lib/eventsStore';
import EventsBrowser from '@/components/Events/EventsBrowser';
import SiteHeader from '@/components/Layout/SiteHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Événements',
  description:
    "Tous les événements de Vexilon Esport : LAN, tournois Valorant, cleaning days et rendez-vous communautaires dans l'Yonne. Événements à venir et éditions passées.",
  alternates: { canonical: '/evenements' },
  openGraph: {
    title: 'Événements | VEXILON ESPORT',
    description:
      "Tous les événements de Vexilon Esport : LAN, tournois, et rendez-vous communautaires dans l'Yonne.",
    url: '/evenements',
  },
};

export default function EvenementsPage() {
  const events = getAllEvents();
  const now = new Date();
  const upcoming = events.filter((event) => resolveStatus(event, now) === 'upcoming');
  const past = events.filter((event) => resolveStatus(event, now) === 'past');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      <SiteHeader />

      {/* ── En-tête ─────────────────────────────────────────────────── */}
      {/* Même structure que la page Actualités, pour que les deux
          rubriques du site aient exactement la même allure. */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-wider">
              ÉVÉNE<span className="text-vexilon-primary">MENTS</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              Tous les rendez-vous de VEXILON.
            </p>
          </div>
        </div>
      </header>

      {/* ── Contenu ─────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <EventsBrowser upcoming={upcoming} past={past} />
      </main>
    </div>
  );
}
