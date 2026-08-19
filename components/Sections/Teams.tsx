'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Teams.module.css';

gsap.registerPlugin(ScrollTrigger);

interface MemberData {
  firstName: string;
  lastName: string;
  image: string;
  role: string;
}

const teamMembers: MemberData[] = [
  { firstName: "Rodrigo", lastName: "TELES DOS SANTOS", image: "/img/img1.jpg", role: "Trésorier" },
  { firstName: "Amélia",  lastName: "FERNANDES",        image: "/img/img2.jpg", role: "Secrétaire" },
  { firstName: "Yoann",   lastName: "FERRAND",          image: "/img/img3.jpg", role: "Vice-Président & Fondateur" },
  { firstName: "Ilia",    lastName: "Choumitzky",       image: "/img/img4.jpg", role: "Développeur fullstack" },
  { firstName: "Eduardo", lastName: "TELES DOS SANTOS", image: "/img/img6.jpg", role: "Président & Fondateur" },
];

const Teams: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const imgsRef = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const section = sectionRef.current;
    if (!wrapper || !section) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    const imgs = imgsRef.current.filter(Boolean) as HTMLDivElement[];
    const overlays = overlayRefs.current.filter(Boolean) as HTMLDivElement[];
    const total = cards.length;

    const orbitMultiplier = () => (window.innerWidth < 768 ? 0.44 : window.innerWidth < 1024 ? 0.36 : 0.32);
    const orbitZ = () => -window.innerWidth * orbitMultiplier();

    const applyTransformOrigins = () => {
      cards.forEach((card) => {
        gsap.set(card, { transformOrigin: `50% 50% ${orbitZ()}px` });
      });
    };

    // Hover via getBoundingClientRect — bypasses unreliable 3D pointer events
    const activeIndex = { current: -1 };

    const showOverlay = (i: number) => {
      if (activeIndex.current === i) return;
      // Hide previous
      if (activeIndex.current !== -1) {
        const prev = activeIndex.current;
        gsap.to(overlays[prev], { opacity: 0, duration: 0.25 });
        gsap.to(imgs[prev].querySelector('img'), { filter: 'brightness(1) grayscale(0)', duration: 0.25 });
      }
      activeIndex.current = i;
      gsap.to(overlays[i], { opacity: 1, duration: 0.25 });
      gsap.to(imgs[i].querySelector('img'), { filter: 'brightness(0.55) grayscale(0.3)', duration: 0.25 });
    };

    const hideAll = () => {
      if (activeIndex.current === -1) return;
      gsap.to(overlays, { opacity: 0, duration: 0.25 });
      imgs.forEach((pic) => {
        gsap.to(pic.querySelector('img'), { filter: 'brightness(1) grayscale(0)', duration: 0.25 });
      });
      activeIndex.current = -1;
    };

    const handleMouseMove = (e: MouseEvent) => {
      let found = -1;
      for (let i = 0; i < imgs.length; i++) {
        const rect = imgs[i].getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          found = i;
          break;
        }
      }
      if (found !== -1) {
        showOverlay(found);
      } else {
        hideAll();
      }
    };

    const handleMouseLeave = () => hideAll();

    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseleave', handleMouseLeave);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        applyTransformOrigins();
        ScrollTrigger.refresh();
      }, 100);
    };
    window.addEventListener('resize', handleResize);

    const ctx = gsap.context(() => {
      const spinTl = gsap.timeline({
        paused: true,
        defaults: { ease: 'none', duration: 36 },
        repeat: -1,
      });

      spinTl.fromTo(
        cards,
        { rotationY: (i: number) => (i * 360) / total },
        { rotationY: '-=360' }
      );

      const entranceTl = gsap.timeline({
        paused: true,
        defaults: { ease: 'power4.out', duration: 1.2 },
      });

      entranceTl.fromTo(
        cards,
        {
          yPercent: () => gsap.utils.random(-100, 100),
          opacity: 0,
          scale: 0.05,
        },
        {
          opacity: 1,
          yPercent: 0,
          scale: 1,
        }
      );

      ScrollTrigger.create({
        trigger: wrapper,
        scrub: true,
        invalidateOnRefresh: true,
        onToggle: ({ isActive }) => {
          if (isActive) {
            spinTl.play();
            if (!hasEnteredRef.current) {
              hasEnteredRef.current = true;
              entranceTl.restart();
            }
          } else {
            spinTl.pause();
          }
        },
        onRefresh: () => {
          gsap.set(imgs, {
            yPercent: (n: number) => gsap.utils.wrap([-25, 0, 25], n),
          });
          applyTransformOrigins();
        },
      });

      ScrollTrigger.refresh();
    }, wrapper);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseleave', handleMouseLeave);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="teams" className={styles.section}>
      <div className={`container mx-auto ${styles.container}`}>
        {/* Headline */}
        <div className={styles.headline}>
          <h2 className={`${styles.titleBig} text-gray-800 dark:text-gray-200`}>
            <span>MY</span> <span>TEAM</span>
          </h2>
        </div>

        {/* Tornado Carousel */}
        <div ref={wrapperRef} className={styles.wrapper}>
          <div className={styles.list}>
            {teamMembers.map((member, i) => (
              <div
                key={`${member.firstName}-${i}`}
                ref={(el) => { cardsRef.current[i] = el; }}
                className={styles.item}
              >
                <div className={styles.card}>
                  <div
                    ref={(el) => { imgsRef.current[i] = el; }}
                    className={styles.pic}
                  >
                    <img src={member.image} alt={`${member.firstName} ${member.lastName}`} />
                    <div
                      ref={(el) => { overlayRefs.current[i] = el; }}
                      className={styles.overlay}
                    >
                      <span className={styles.overlayRole}>{member.role}</span>
                      <span className={styles.overlayName}>{member.firstName}</span>
                      <span className={styles.overlayLastName}>{member.lastName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Teams;
