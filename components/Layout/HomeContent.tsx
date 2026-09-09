'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Preloader from '@/components/UI/Preloader';
import Navbar from '@/components/Layout/Navbar';
import Hero from '@/components/Sections/Hero';
import About from '@/components/Sections/About';
import Teams from '@/components/Sections/Teams';
import Contact from '@/components/Sections/Contact';
import Blog from '@/components/Sections/Blog';
import { usePreloaderStore } from '@/store/preloaderStore';
import { useTheme } from '@/components/ThemeProvider';

const SmoothScroll = dynamic(() => import('@/components/Layout/SmoothScroll'), { ssr: false });

// useLayoutEffect n'existe pas au rendu serveur : on retombe sur useEffect
// pour éviter l'avertissement de React.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function HomeContent() {
  const setPreloaderShown = usePreloaderStore((state) => state.setShown);

  // Le rendu serveur ignore localStorage : il produit donc toujours l'état
  // « animation à jouer ». On tranche juste après le montage, avant le
  // premier affichage, pour ne pas laisser apparaître l'animation.
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useBeforePaint(() => {
    if (usePreloaderStore.getState().shown) {
      setIsLoading(false);
      setContentVisible(true);
    }
  }, []);

  // La Navbar lit le thème elle-même ; seul Hero en a encore besoin ici.
  const { theme } = useTheme();

  const handlePreloaderComplete = () => {
    setIsLoading(false);
    setTimeout(() => {
      setContentVisible(true);
      setPreloaderShown(true);
    }, 100);
  };

  return (
    <div className="relative w-full min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-500 selection:bg-vexilon-primary selection:text-white">
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
      {!isLoading && (
        <SmoothScroll>
          <div className={`transition-opacity duration-1000 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
            <Navbar />
            <main className="relative z-10 flex flex-col gap-0">
              <Hero theme={theme} />
              <About />
              <Teams />
              <Blog />
              <Contact />
            </main>
          </div>
        </SmoothScroll>
      )}
    </div>
  );
}
