'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sun, Moon, Menu, X } from 'lucide-react';

interface NavbarProps {
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

const navLinks = [
  { name: 'Accueil',      href: '#hero' },
  { name: 'Présentation', href: '#about' },
  { name: 'Équipes',      href: '#teams' },
  { name: 'Membres',      href: '/membres' },
  { name: 'Actualités',   href: '/blog' },
  { name: 'Contact',      href: '#contact' },
];

const Navbar = ({ theme = 'dark', toggleTheme }: NavbarProps) => {
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

  const pillLight =
    'bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.08)]';

  const pillScrolled = scrolled
    ? theme === 'dark'
      ? 'shadow-[0_0_0_1px_rgba(188,19,254,0.25),0_12px_40px_rgba(0,0,0,0.5)]'
      : 'shadow-[0_4px_32px_rgba(0,0,0,0.12)]'
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
                    : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
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
