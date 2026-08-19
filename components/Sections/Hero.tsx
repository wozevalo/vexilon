'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import dynamic from 'next/dynamic';

const Background3D   = dynamic(() => import('@/components/Layout/Background3D'),  { ssr: false });
const BackgroundOrbs = dynamic(() => import('@/components/Layout/BackgroundOrbs'), { ssr: false });

interface HeroProps {
  theme?: 'dark' | 'light';
}

const Hero = ({ theme = 'dark' }: HeroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // GSAP Animations — skipped if user prefers reduced motion
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, { y: 100, opacity: 0, duration: 1, delay: 0.5, ease: 'power4.out' });
      gsap.from(logoRef.current, { y: 50, opacity: 0, duration: 1, delay: 0.3, ease: 'power3.out' });
      gsap.from(ctaRef.current, { y: 50, opacity: 0, duration: 1, delay: 1.1, ease: 'power3.out' });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={containerRef} className={`relative w-full flex items-center justify-center px-6 overflow-hidden ${theme === 'dark' ? 'bg-[#020108]' : 'bg-gray-50'}`} style={{ height: '100svh', minHeight: '100dvh' }}>
      {theme === 'dark' ? <Background3D /> : <BackgroundOrbs />}
      <div className="container mx-auto text-center z-10 relative">
        <div ref={logoRef} className="flex justify-center mb-8">
          <Image
            src={theme === 'dark' ? '/logo.png' : '/logo-dark.png'}
            alt="VEXILON Logo"
            width={208}
            height={80}
            priority
            className="w-32 md:w-44 lg:w-52 h-auto"
          />
        </div>
        <h1
          ref={titleRef}
          className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-none mb-8 text-gray-900 dark:text-white dark:mix-blend-difference transition-colors duration-500"
        >
          VEXILON <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400 dark:from-white dark:via-gray-400 dark:to-gray-600">ESPORT</span>
        </h1>
        <div ref={ctaRef} className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12">
          <a href="#about" className="px-8 py-4 bg-vexilon-primary text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-900 dark:hover:bg-white dark:hover:text-black transition-colors duration-300 skew-x-[-12deg]">
            <span className="block skew-x-[12deg]">Découvrir</span>
          </a>
          <a href="#contact" className="px-8 py-4 border border-gray-900 dark:border-white text-gray-900 dark:text-white font-bold uppercase tracking-widest text-sm hover:border-vexilon-primary hover:text-vexilon-primary transition-colors duration-300 skew-x-[-12deg]">
            <span className="block skew-x-[12deg]">Nous Contacter</span>
          </a>
        </div>
      </div>

      {/* Decorative Elements */}
      
    </section>
  );
};

export default Hero;
