'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface NavbarProps {
  /** Optionnels : sans eux, le thème vient directement du ThemeProvider. */
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

// Les ancres sont préfixées par « / » pour rester valables depuis n'importe
// quelle page : depuis /evenements, « /#teams » ramène à l'accueil puis défile.
const navLinks = [
  { name: 'Accueil',      href: '/#hero' },
  { name: 'Membres',      href: '/membres' },
  { name: 'Événements',   href: '/evenements' },
  { name: 'Actualités',   href: '/blog' },
  { name: 'Contact',      href: '/#contact' },
];

const Navbar = ({ theme: themeProp, toggleTheme: toggleThemeProp }: NavbarProps) => {
  const context = useTheme();
  const theme = themeProp ?? context.theme;
  const toggleTheme = toggleThemeProp ?? context.toggleTheme;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const pillBase =
    'fixed top-4 z-50 flex items-center justify-between gap-6 px-5 py-2.5 rounded-full transition-all duration-300' +
    ' left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto';

  const pillDark =
    'bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_0_1px_rgba(188,19,254,0.15),0_8px_32px_rgba(0,0,0,0.4)]';

  // Thème clair : fond blanc franc, sans contour — seule une ombre douce
  // détache la barre de la page. Le noir est réservé au texte.
  const pillLight =
    'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.10)]';

  const pillScrolled = scrolled
    ? theme === 'dark'
      ? 'shadow-[0_0_0_1px_rgba(188,19,254,0.25),0_12px_40px_rgba(0,0,0,0.5)]'
      : 'shadow-[0_6px_28px_rgba(0,0,0,0.18)]'
    : '';

  return (
    <>
      {/* ── Pill Navbar ─────────────────────────────────────────────────── */}
      <nav className={`${pillBase} ${theme === 'dark' ? pillDark : pillLight} ${pillScrolled}`}>
        {/* Logo — visible on mobile only */}
        <span className={`md:hidden text-xs font-bold tracking-[0.2em] uppercase select-none
          ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          VEXILON
        </span>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                className={`relative px-3 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-full transition-all duration-200 group
                  ${theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-white/8'
                    : 'text-gray-900 hover:text-gray-900 hover:bg-black/5'
                  }`}
              >
                {link.name}
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-px bg-vexilon-primary transition-all duration-300 group-hover:w-4"
                />
              </a>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Changer le thème"
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200
              ${theme === 'dark'
                ? 'bg-white/8 hover:bg-white/15 text-yellow-400'
                : 'bg-black/5 hover:bg-black/10 text-gray-600'
              }`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Ouvrir le menu"
            className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200
              ${theme === 'dark'
                ? 'bg-white/8 hover:bg-white/15 text-white'
                : 'bg-black/5 hover:bg-black/10 text-gray-900'
              }`}
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* ── Fullscreen Mobile Menu ───────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-in-out
          ${theme === 'dark' ? 'bg-black' : 'bg-white'}
          ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        
        <div className="flex flex-col items-center justify-center h-full gap-7">
          
          {navLinks.map((link, i) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-bold tracking-[0.15em] uppercase transition-all duration-500 ease-out
                ${theme === 'dark' ? 'text-white hover:text-vexilon-primary' : 'text-gray-900 hover:text-vexilon-primary'}
                ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: isMobileMenuOpen ? `${i * 70 + 150}ms` : '0ms' }}
            >
              {link.name}
            </a>
          ))}
          
        </div>
        
      </div>
    </>
  );
};

export default Navbar;
