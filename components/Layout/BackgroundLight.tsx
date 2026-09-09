'use client';

import { useEffect, useRef } from 'react';

/**
 * Fond animé du Hero en thème clair.
 *
 * Shader du composant open source « MoltenMetal » de React Bits (licence MIT),
 * porté en WebGL 2 brut : la dépendance `ogl` ne servirait qu'à créer le
 * contexte et un triangle plein écran, ce que fait le code ci-dessous.
 *
 * Le pendant sombre est Background3D.
 */

/* ── Réglages retenus ─────────────────────────────────────────────────
   Grain et interaction souris sont volontairement désactivés : le shader
   reste identique à la source, ce sont ses uniformes `uGrain` et
   `uEnableMouse` qui les neutralisent.
   ────────────────────────────────────────────────────────────────────── */
const SETTINGS = {
  color1: '#b700ff', // ombre
  color2: '#b700ff', // médium
  color3: '#000000', // cœur des filaments
  backgroundColor: '#ffffff',
  speed: 0.4,
  scale: 12,
  detail: 5,
  glow: 1.64,
  coreSize: 0.1,
  swirl: 1,
  fold: -0.2,
  blackPoint: 0.025,
  brightness: 1.2,
  colorMode: 0, // molten
  grain: 0,
  grainIntensity: 0.05,
  mouseInteraction: 0,
  mouseStrength: 0.3,
  opacity: 1,
  lightMode: 1,
};

/**
 * Comportement face au réglage système « réduire les animations ».
 *
 *   'respect' — le fond se fige quand le visiteur a demandé moins d'animations.
 *               C'est le comportement recommandé.
 *   'always'  — le fond s'anime dans tous les cas.
 *
 * Réglé sur 'always' à la demande : ce fond est purement décoratif, son
 * mouvement est lent et continu, sans clignotement ni lien avec le défilement.
 * Repasser à 'respect' rétablit le comportement recommandé, sans autre change-
 * ment à faire ailleurs.
 */
const MOTION_POLICY: 'respect' | 'always' = 'always';

/** Densité maximale suivie, au-delà le gain visuel ne se voit plus */
const MAX_PIXEL_RATIO = 3;

/**
 * Budget de pixels calculés par image.
 *
 * Réglé au-dessus de ce que demande un écran 4K en densité 1 (8,3 M), afin
 * qu'aucune configuration qui fonctionne aujourd'hui ne perde en netteté ;
 * et très au-dessus de ce que demande un téléphone à DPR 3 (~3 M), qui était
 * justement le cas dégradé. Le garde-fou ne se déclenche donc que pour des
 * surfaces vraiment hors normes, type 4K en densité 2.
 */
const MAX_RENDERED_PIXELS = 9_000_000;

const VERT = [
  '#version 300 es',
  'in vec2 position;',
  'void main() {',
  '  gl_Position = vec4(position, 0.0, 1.0);',
  '}',
].join('\n');

const FRAG = [
  '#version 300 es',
  'precision highp float;',
  'uniform vec2 iResolution;',
  'uniform float iTime;',
  'uniform float uSpeed;',
  'uniform float uScale;',
  'uniform float uDetail;',
  'uniform float uGlow;',
  'uniform float uCoreSize;',
  'uniform float uSwirl;',
  'uniform float uFold;',
  'uniform float uBlackPoint;',
  'uniform float uBrightness;',
  'uniform float uColorMode;',
  'uniform float uGrain;',
  'uniform float uGrainIntensity;',
  'uniform float uOpacity;',
  'uniform vec2 uMouse;',
  'uniform float uMouseStrength;',
  'uniform bool uEnableMouse;',
  'uniform vec3 uColor1;',
  'uniform vec3 uColor2;',
  'uniform vec3 uColor3;',
  'uniform vec3 uBackgroundColor;',
  'uniform bool uLightMode;',
  'out vec4 fragColor;',
  '',
  'float hash(vec2 p) {',
  '  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);',
  '}',
  '',
  'void main() {',
  '  float time = iTime * uSpeed;',
  '  vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;',
  '',
  '  vec2 drift = vec2(0.0);',
  '  if (uEnableMouse) {',
  '    drift = (uMouse - 0.5) * uMouseStrength * 2.0;',
  '  }',
  '  p += drift;',
  '',
  '  vec2 i = p;',
  '  float c = 0.0;',
  '  float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);',
  '  float d = length(p);',
  '  float rot = d + time + p.x * uSwirl;',
  '',
  '  float cosRot = cos(rot);',
  '  mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;',
  '  float glowCore = uGlow * uCoreSize;',
  '',
  '  for (float n = 0.0; n < 8.0; n++) {',
  '    if (n >= uDetail) break;',
  '    p *= warp;',
  '    float t = r - time / (n + 3.0);',
  '    i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);',
  '    c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));',
  '  }',
  '',
  '  c /= 6.0;',
  '',
  '  float intensity = max(c - uBlackPoint, 0.0) * uBrightness;',
  '  float g = clamp(intensity, 0.0, 1.0);',
  '',
  '  float mid = 0.5;',
  '  if (uColorMode > 1.5) {',
  '    mid = 0.65;',
  '  } else if (uColorMode > 0.5) {',
  '    mid = 0.35;',
  '  }',
  '',
  '  vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));',
  '  col = mix(col, uColor3, smoothstep(mid, 1.0, g));',
  '',
  '  float a = g;',
  '  if (uGrain > 0.5) {',
  '    float gr = hash(gl_FragCoord.xy + iTime);',
  '    a += (gr - 0.5) * uGrainIntensity;',
  '  }',
  '  a = clamp(a, 0.0, 1.0) * uOpacity;',
  '  if (uLightMode) {',
  '    float signal = 1.0 - exp(-max(c, 0.0) * 6.5);',
  '    float body = smoothstep(0.075, 0.68, signal);',
  '    float ridge = smoothstep(0.42, 0.92, signal);',
  '',
  '    vec3 lightCol = mix(uColor1, uColor2, smoothstep(0.08, 0.52, signal));',
  '    lightCol = mix(lightCol, uColor3, smoothstep(0.52, 0.96, signal));',
  '    lightCol = mix(lightCol, lightCol * 0.72, ridge * 0.24);',
  '',
  '    float coverage = body * mix(0.2, 0.86, signal) * uOpacity;',
  '    if (uGrain > 0.5) {',
  '      float gr = hash(gl_FragCoord.xy + iTime);',
  '      coverage += (gr - 0.5) * uGrainIntensity * body * 0.16;',
  '    }',
  '    fragColor = vec4(mix(uBackgroundColor, lightCol, clamp(coverage, 0.0, 0.92)), 1.0);',
  '  } else {',
  '    fragColor = vec4(col * a, a);',
  '  }',
  '}',
].join('\n');

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [1, 1, 1];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

export default function BackgroundLight() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Le canvas est créé ici, et non rendu par React : en développement,
    // React monte les effets deux fois, et le nettoyage libère le contexte
    // WebGL. Un canvas rendu par React serait réutilisé au second montage
    // avec un contexte déjà perdu — le shader échouerait à compiler et
    // getShaderInfoLog renverrait null. Un canvas neuf par effet évite cela.
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
    container.appendChild(canvas);

    // Retire le canvas même si l'initialisation échoue : sans cela, le double
    // montage du mode strict en empilerait un second.
    const detach = () => {
      if (canvas.parentElement === container) container.removeChild(canvas);
    };

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    // WebGL 2 absent : on laisse simplement le fond blanc du Hero
    if (!gl) return detach;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
          'BackgroundLight — shader :',
          gl.getShaderInfoLog(shader) || '(aucun message)',
          gl.isContextLost() ? '— contexte WebGL perdu' : ''
        );
        return null;
      }
      return shader;
    };

    const vertexShader = compile(gl.VERTEX_SHADER, VERT);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vertexShader || !fragmentShader) return detach;

    const program = gl.createProgram();
    if (!program) return detach;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('BackgroundLight — programme :', gl.getProgramInfoLog(program));
      return detach;
    }
    gl.useProgram(program);

    // Triangle plein écran
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const U = {
      iResolution: u('iResolution'),
      iTime: u('iTime'),
      uSpeed: u('uSpeed'),
      uScale: u('uScale'),
      uDetail: u('uDetail'),
      uGlow: u('uGlow'),
      uCoreSize: u('uCoreSize'),
      uSwirl: u('uSwirl'),
      uFold: u('uFold'),
      uBlackPoint: u('uBlackPoint'),
      uBrightness: u('uBrightness'),
      uColorMode: u('uColorMode'),
      uGrain: u('uGrain'),
      uGrainIntensity: u('uGrainIntensity'),
      uOpacity: u('uOpacity'),
      uMouse: u('uMouse'),
      uMouseStrength: u('uMouseStrength'),
      uEnableMouse: u('uEnableMouse'),
      uColor1: u('uColor1'),
      uColor2: u('uColor2'),
      uColor3: u('uColor3'),
      uBackgroundColor: u('uBackgroundColor'),
      uLightMode: u('uLightMode'),
    };

    // Les valeurs constantes ne sont envoyées qu'une fois
    gl.uniform1f(U.uSpeed, SETTINGS.speed);
    gl.uniform1f(U.uScale, SETTINGS.scale);
    gl.uniform1f(U.uDetail, SETTINGS.detail);
    gl.uniform1f(U.uGlow, SETTINGS.glow);
    gl.uniform1f(U.uCoreSize, SETTINGS.coreSize);
    gl.uniform1f(U.uSwirl, SETTINGS.swirl);
    gl.uniform1f(U.uFold, SETTINGS.fold);
    gl.uniform1f(U.uBlackPoint, SETTINGS.blackPoint);
    gl.uniform1f(U.uBrightness, SETTINGS.brightness);
    gl.uniform1f(U.uColorMode, SETTINGS.colorMode);
    gl.uniform1f(U.uGrain, SETTINGS.grain);
    gl.uniform1f(U.uGrainIntensity, SETTINGS.grainIntensity);
    gl.uniform1f(U.uOpacity, SETTINGS.opacity);
    gl.uniform2f(U.uMouse, 0.5, 0.5);
    gl.uniform1f(U.uMouseStrength, SETTINGS.mouseStrength);
    gl.uniform1i(U.uEnableMouse, SETTINGS.mouseInteraction);
    gl.uniform3fv(U.uColor1, hexToRgb(SETTINGS.color1));
    gl.uniform3fv(U.uColor2, hexToRgb(SETTINGS.color2));
    gl.uniform3fv(U.uColor3, hexToRgb(SETTINGS.color3));
    gl.uniform3fv(U.uBackgroundColor, hexToRgb(SETTINGS.backgroundColor));
    gl.uniform1i(U.uLightMode, SETTINGS.lightMode);

    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      // Un plafond fixe de 2 rendait les téléphones flous : à DPR 3, ils
      // n'étaient calculés qu'aux deux tiers de leur résolution avant d'être
      // étirés. On suit donc la densité réelle de l'écran, en la limitant
      // par un budget de pixels plutôt que par un DPR arbitraire : c'est le
      // nombre de pixels à calculer qui coûte, pas la densité en elle-même.
      // Un téléphone reste bien en dessous du budget malgré son DPR élevé,
      // parce que sa surface en points CSS est petite.
      const density = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const requested = width * height * density * density;
      const ratio =
        requested > MAX_RENDERED_PIXELS
          ? density * Math.sqrt(MAX_RENDERED_PIXELS / requested)
          : density;

      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (observer) observer.observe(container);
    window.addEventListener('resize', resize);

    // Réglage système « réduire les animations ». Il fige volontairement le
    // fond : c'est le comportement attendu, mais c'est aussi la première cause
    // d'un « rien ne bouge » alors que tout s'affiche — d'où le message ci-dessous.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = MOTION_POLICY === 'respect' && motionQuery.matches;

    if (reduceMotion && process.env.NODE_ENV !== 'production') {
      console.info(
        'BackgroundLight : animation figée car votre système demande de réduire ' +
        'les animations (Paramètres → Accessibilité → Effets visuels → Effets d’animation).'
      );
    }

    const onMotionChange = (e: MediaQueryListEvent) => {
      reduceMotion = MOTION_POLICY === 'respect' && e.matches;
      last = 0;
    };
    motionQuery.addEventListener('change', onMotionChange);

    let raf = 0;
    let elapsed = 0;
    let last = 0;
    // La compilation du shader prend un instant : on ne révèle le canvas
    // qu'une fois la première image réellement dessinée, en fondu, plutôt
    // que de le laisser apparaître d'un coup.
    let revealed = false;

    const render = (time: number) => {
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 0;
      last = time;
      if (!reduceMotion) elapsed += dt;

      gl.uniform2f(U.iResolution, canvas.width, canvas.height);
      gl.uniform1f(U.iTime, elapsed);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!revealed) {
        revealed = true;
        container.style.opacity = '1';
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // Le shader ne doit tourner que s'il est réellement regardé : onglet au
    // premier plan ET Hero visible à l'écran. Sans le second test, le GPU
    // calculait encore pendant qu'on lisait le bas de la page.
    let tabVisible = !document.hidden;
    let onScreen = true;

    const sync = () => {
      const shouldRun = tabVisible && onScreen;
      if (shouldRun && raf === 0) {
        last = 0;
        raf = requestAnimationFrame(render);
      } else if (!shouldRun && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onVisibility = () => {
      tabVisible = !document.hidden;
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const inView =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting;
              sync();
            },
            { threshold: 0 }
          )
        : null;
    inView?.observe(container);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      motionQuery.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
      inView?.disconnect();
      window.removeEventListener('resize', resize);
      observer?.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      detach();
    };
  }, []);

  // Le shader peint des pixels opaques : sans ce fondu, le champ violet
  // serait tranché net au bas du Hero. Le masque le dissout dans le blanc
  // avant la jonction avec la section suivante.
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, #000 68%, transparent 97%)',
        maskImage: 'linear-gradient(to bottom, #000 68%, transparent 97%)',
        opacity: 0,
        transition: 'opacity 0.7s ease',
      }}
    />
  );
}
