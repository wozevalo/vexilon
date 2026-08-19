'use client';

import { useEffect, useRef } from 'react';

const BackgroundOrbs = () => {
  const orbCenterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orb = orbCenterRef.current;
    if (!orb) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let ox = tx;
    let oy = ty;
    let rafId: number;

    const onMouse = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    document.addEventListener('mousemove', onMouse);

    const follow = () => {
      rafId = requestAnimationFrame(follow);
      ox += (tx - ox) * 0.008;
      oy += (ty - oy) * 0.008;
      orb.style.left = `${ox}px`;
      orb.style.top  = `${oy}px`;
    };
    follow();

    return () => {
      document.removeEventListener('mousemove', onMouse);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        .orb { position: absolute; border-radius: 50%; mix-blend-mode: multiply; will-change: transform; }
        .orb-1 { width:900px;height:900px; background:radial-gradient(circle,rgba(188,19,254,.22) 0%,transparent 65%); filter:blur(90px); top:-20%;left:-10%; animation:orbF1 65s ease-in-out infinite alternate; }
        .orb-2 { width:700px;height:700px; background:radial-gradient(circle,rgba(100,0,255,.16) 0%,transparent 65%); filter:blur(110px); top:20%;right:-15%; animation:orbF2 80s ease-in-out infinite alternate; }
        .orb-3 { width:600px;height:600px; background:radial-gradient(circle,rgba(160,40,255,.18) 0%,transparent 65%); filter:blur(80px); bottom:-15%;left:20%; animation:orbF3 55s ease-in-out infinite alternate; }
        .orb-4 { width:420px;height:420px; background:radial-gradient(circle,rgba(188,19,254,.14) 0%,transparent 65%); filter:blur(60px); top:5%;right:10%; animation:orbF4 45s ease-in-out infinite alternate; }
        .orb-5 { width:500px;height:500px; background:radial-gradient(circle,rgba(70,0,190,.12) 0%,transparent 65%); filter:blur(100px); bottom:10%;left:-8%; animation:orbF5 70s ease-in-out infinite alternate; }
        .orb-center { width:380px;height:380px; background:radial-gradient(circle,rgba(188,19,254,.09) 0%,transparent 60%); filter:blur(50px); transform:translate(-50%,-50%); animation:orbPulse 18s ease-in-out infinite alternate; }
        @keyframes orbF1 { to { transform: translate(70px,55px) scale(1.08); } }
        @keyframes orbF2 { to { transform: translate(-60px,-45px) scale(1.06); } }
        @keyframes orbF3 { to { transform: translate(55px,-70px) scale(0.94); } }
        @keyframes orbF4 { to { transform: translate(-45px,60px) scale(1.10); } }
        @keyframes orbF5 { to { transform: translate(65px,-40px) scale(1.04); } }
        @keyframes orbPulse {
          from { opacity:.7; transform:translate(-50%,-50%) scale(0.92); }
          to   { opacity:1;  transform:translate(-50%,-50%) scale(1.08); }
        }
      `}</style>

      {/* Orbs container */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />
        <div ref={orbCenterRef} className="orb orb-center" style={{ position: 'absolute' }} />
      </div>
    </>
  );
};

export default BackgroundOrbs;
