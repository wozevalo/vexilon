'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const poles = [
  {
    label: 'Le Bureau',
    count: '4 membres',
    description: 'Assurant la direction et la gestion administrative.',
    names: ['Eduardo TELES DOS SANTOS — Président & Fondateur', 'Yoann FERRAND — Vice-Président & Fondateur', 'Amélia FERNANDES — Secrétaire', 'Rodrigo TELES DOS SANTOS — Trésorier'],
  },
  {
    label: 'Pôle Technique',
    count: '1 membre',
    description: 'Développeur full-stack',
    names: ['Ilia Choumitzky — Développement Web'],
  },
  {
    label: 'Équipe de Terrain',
    count: '6 membres',
    description: 'Membres permanents et réseau de soutiens mobilisables.',
    names: [],
  },
];

export default function MembresPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F1A] text-gray-900 dark:text-white transition-colors duration-300">

      {/* ── Back link ─────────────────────────────────── */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#BC13FE] transition-colors duration-200"
        >
          <ArrowLeft size={14} />
          Retour
        </Link>
      </div>

      {/* ── Hero image ───────────────────────────────────── */}
      <div className="w-full pt-20 pb-10 px-6 md:px-16 lg:px-24">
        <div className="relative w-full h-[55vh] min-h-[340px] max-h-[600px] overflow-hidden rounded-2xl">
          {/* Image */}
          <img
            src="/img/team.jpg"
            alt="Membres Vexilon"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60 rounded-2xl" />

          {/* Title centred on image */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        
          <h1
            className="font-black uppercase leading-none"
            style={{
              fontSize: 'clamp(2.8rem, 9vw, 8rem)',
              letterSpacing: '-0.02em',
              textShadow: '0 0 60px rgba(188,19,254,0.25)',
            }}
          >
            DES MEMBRES
            <br />
            <span style={{ color: '#BC13FE', textShadow: '0 0 40px rgba(188,19,254,0.6)' }}>
              ENGAGÉS
            </span>
          </h1>
        </div>
        </div>
      </div>

      {/* ── Description ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-8">
        <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl leading-relaxed">
          Notre structure s'appuie sur un noyau dur de{' '}
          <span className="text-gray-900 dark:text-white font-semibold">11 membres actifs</span>,
          renforcés par des bénévoles opérationnels pour garantir le succès de nos rassemblements.
        </p>
      </section>

      {/* ── Divider ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#BC13FE]/40 to-transparent" />
      </div>

      {/* ── Pôles ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {poles.map((pole) => (
          <div
            key={pole.label}
            className="relative border border-gray-200 dark:border-white/8 rounded-2xl p-7 bg-white dark:bg-white/[0.03] hover:border-[#BC13FE]/40 hover:bg-[#BC13FE]/[0.03] dark:hover:bg-[#BC13FE]/[0.04] transition-all duration-300 group shadow-sm dark:shadow-none"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#BC13FE]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-4 translate-x-4" />

            <span className="text-[#BC13FE] text-xs font-bold tracking-[0.25em] uppercase">
              {pole.count}
            </span>
            <h3 className="text-gray-900 dark:text-white text-xl font-bold mt-2 mb-3 tracking-tight">
              {pole.label}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
              {pole.description}
            </p>

            {pole.names.length > 0 && (
              <ul className="space-y-1.5">
                {pole.names.map((name) => (
                  <li key={name} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#BC13FE] shrink-0" />
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      {/* ── Total count banner ────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-[#BC13FE]/20 bg-[#BC13FE]/5 px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="max-w-lg space-y-2">
            <p className="text-gray-900 dark:text-white font-bold text-base md:text-lg">
              11 membres !
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Une communauté en pleine expansion — chaque événement attire de nouveaux talents,
              de nouveaux engagements. VEXILON grandit vite, et les portes restent ouvertes.
            </p>
          </div>
          <span
            className="text-5xl md:text-6xl font-black tabular-nums"
            style={{ color: '#BC13FE', textShadow: '0 0 30px rgba(188,19,254,0.5)' }}
          >
            11
          </span>
        </div>
      </section>

    </div>
  );
}
