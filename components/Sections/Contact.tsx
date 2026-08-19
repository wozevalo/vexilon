import React from 'react';
import { Instagram, Twitch, Youtube, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z"/>
  </svg>
);

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const DiscordIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);
const Contact: React.FC = () => {
  return (
    <section id="contact" className="relative pt-24 pb-12 px-6 border-t border-gray-200/20 dark:border-gray-800/30 transition-colors duration-500">
      <div className="container mx-auto">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-6">VEXILON ESPORT</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
              Structure Esport française ambitieuse et professionnelle. 
              Rejoignez l'aventure et suivez nos exploits.
            </p>
            <div className="flex gap-4 flex-wrap">
              {[
                { Icon: Twitch,    href: 'https://www.twitch.tv/vexilonesport' },
                { Icon: Instagram, href: 'https://www.instagram.com/vexilon.esport' },
                { Icon: Youtube,   href: 'https://www.youtube.com/@VexilonEsport' },
              ].map(({ Icon, href }, idx) => (
                <a key={idx} href={href} target="_blank" rel="noopener noreferrer nofollow" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-vexilon-primary hover:text-white dark:hover:bg-vexilon-primary dark:hover:text-white transition-all duration-300">
                  <Icon size={18} />
                </a>
              ))}
              <a href="https://www.tiktok.com/@vexilon.esport" target="_blank" rel="noopener noreferrer nofollow" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-vexilon-primary hover:text-white dark:hover:bg-vexilon-primary dark:hover:text-white transition-all duration-300">
                <TikTokIcon size={18} />
              </a>
              <a href="https://www.facebook.com/groups/843440898694334" target="_blank" rel="noopener noreferrer nofollow" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-vexilon-primary hover:text-white dark:hover:bg-vexilon-primary dark:hover:text-white transition-all duration-300">
                <FacebookIcon size={18} />
              </a>
              <a href="https://discord.gg/3RrBTYCcUr" target="_blank" rel="noopener noreferrer nofollow" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-vexilon-primary hover:text-white dark:hover:bg-vexilon-primary dark:hover:text-white transition-all duration-300">
                <DiscordIcon size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold uppercase tracking-widest mb-6">Navigation</h3>
            <ul className="space-y-4">
              {[
                { label: 'Accueil',       href: '#hero' },
                { label: 'Présentation',  href: '#about' },
                { label: 'Équipes',       href: '#teams' },
                { label: 'Blog',          href: '#blog' },
                { label: 'Contact',       href: '#contact' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-gray-600 dark:text-gray-500 hover:text-vexilon-primary dark:hover:text-vexilon-primary transition-colors text-sm uppercase font-semibold">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold uppercase tracking-widest mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Mail size={16} className="text-vexilon-primary" />
                <span className="text-sm">contact@vexilon-esport.fr</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <MapPin size={16} className="text-vexilon-primary" />
                <span className="text-sm">Les Étangs de Saint-Ange89400 Bussy-en-Othe</span>
              </li>
            </ul>
          
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 dark:text-gray-600">
          <p>&copy; 2026 VEXILON ESPORT. Tous droits réservés.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/mentions-legales" className="hover:text-gray-900 dark:hover:text-white">Mentions Légales</Link>
            <Link href="/confidentialite" className="hover:text-gray-900 dark:hover:text-white">Confidentialité</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;