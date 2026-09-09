'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Newspaper, CalendarDays, ExternalLink } from 'lucide-react';
import { logout } from '@/lib/auth';

const TABS = [
  { label: 'Actualités', href: '/gestion/blog', icon: Newspaper, publicHref: '/blog' },
  { label: 'Événements', href: '/gestion/evenements', icon: CalendarDays, publicHref: '/evenements' },
];

interface AdminShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = TABS.find((tab) => pathname?.startsWith(tab.href)) || TABS[0];

  const handleLogout = async () => {
    await logout();
    router.push('/gestion');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-bold uppercase tracking-widest">
                Back-office <span className="text-vexilon-primary">{title}</span>
              </h1>
              <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={activeTab.publicHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir la page
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>

          {/* Onglets */}
          <nav className="flex items-center gap-1 mt-5 -mb-px">
            {TABS.map((tab) => {
              const isActive = tab.href === activeTab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={
                    'flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ' +
                    (isActive
                      ? 'border-vexilon-primary text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300')
                  }
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
