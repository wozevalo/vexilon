'use client';

import { useState } from 'react';
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

export default function HomeContent() {
  const preloaderShown = usePreloaderStore((state) => state.shown);
  const setPreloaderShown = usePreloaderStore((state) => state.setShown);

  const [isLoading, setIsLoading] = useState(!preloaderShown);
  const [contentVisible, setContentVisible] = useState(preloaderShown);
  const { theme, toggleTheme } = useTheme();

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
            <Navbar theme={theme} toggleTheme={toggleTheme} />
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
