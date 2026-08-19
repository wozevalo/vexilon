'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader = ({ onComplete }: PreloaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: onComplete
      });

      // Initial State
      gsap.set([textRef.current, logoRef.current], { 
        y: 50, 
        opacity: 0 
      });

      // Animation Sequence
      tl.to(logoRef.current, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out"
      })
      .to(textRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.6")
      // Pause to let user read
      .to({}, { duration: 0.5 })
      // The Massive Zoom Scale Effect
      .to(containerRef.current, {
        scale: 100, // Extreme zoom as requested
        opacity: 0, // Fade out during zoom
        duration: 1.5,
        ease: "expo.inOut",
        transformOrigin: "center center"
      })
      // Ensure it's hidden properly after zoom
      .set(overlayRef.current, { display: "none" });

    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
    >
      <div 
        ref={containerRef}
        className="relative flex flex-col items-center justify-center p-10 bg-black"
        style={{ willChange: 'transform, opacity' }} // Performance hint
      >
        {/* Placeholder for SVG Logo - Using a styled div for now */}
        <div ref={logoRef} className="mb-6">
          <img
            src="/logo.png"
            alt="VEXILON"
            className="w-24 md:w-32 h-auto"
          />
        </div>
        
        <h1 
          ref={textRef}
          className="text-4xl md:text-6xl font-display font-bold tracking-widest text-white whitespace-nowrap"
        >
          VEXILON <span className="text-vexilon-primary">ESPORT</span>
        </h1>
      </div>
    </div>
  );
};

export default Preloader;