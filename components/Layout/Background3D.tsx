'use client';

import { useEffect, useRef } from 'react';

// ── Palette (TypeScript constants → interpolated into GLSL at module load time)
// Exact site palette: #000005 → #48005e → #7e00a8 → #9900ce → #bc13fe → #f1c6ff
const f = (r: number, g: number, b: number) =>
  `vec3(${r.toFixed(3)},${g.toFixed(3)},${b.toFixed(3)})`;
const S0 = f(0.008, 0.005, 0.030);
const S1 = f(0.030, 0.015, 0.180);
const S2 = f(0.100, 0.040, 0.550);
const S3 = f(0.280, 0.060, 0.900);
const S4 = f(0.600, 0.150, 1.000);
const S5 = f(0.820, 0.620, 1.000);

// ── Vertex shader ──────────────────────────────────────────────────────────────
// position attribute: 2D quad from -1..1, mapped to UV 0..1
const VERT = `
  attribute vec2 position;
  varying   vec2 vUv;
  void main() {
    vUv         = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// ── Fragment shader — Palette violette exacte du site ─────────────────────────
const FRAG = `
  precision highp float;
  uniform float uTime;
  uniform float uAspect;
  varying vec2  vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2  r = mat2(cos(0.8), sin(0.8), -sin(0.8), cos(0.8));
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p  = r * p * 2.2 + vec2(3.1, 7.5);
      a *= 0.5;
    }
    return v;
  }

  /* Palette exacte du site (stops normalisés)
     s0  void         (#000005)   base absolue noire
     s1  950          (#48005e)   0.282 0.000 0.369
     s2  800          (#7e00a8)   0.494 0.000 0.659
     s3  700          (#9900ce)   0.600 0.000 0.808
     s4  600 primary  (#bc13fe)   0.737 0.075 0.996
     s5  200          (#f1c6ff)   0.945 0.776 1.000  */
  vec3 grad(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 s0 = ${S0};
    vec3 s1 = ${S1};
    vec3 s2 = ${S2};
    vec3 s3 = ${S3};
    vec3 s4 = ${S4};
    vec3 s5 = ${S5};
    float s = t * 5.0;
    if (s < 1.0) return mix(s0, s1, s);
    if (s < 2.0) return mix(s1, s2, s - 1.0);
    if (s < 3.0) return mix(s2, s3, s - 2.0);
    if (s < 4.0) return mix(s3, s4, s - 3.0);
    return              mix(s4, s5, s - 4.0);
  }



  void main() {
    // Aspect-corrected UVs so the pattern is identical on portrait/landscape
    vec2  uv   = vec2((vUv.x - 0.5) * uAspect + 0.5, vUv.y);
    float t    = uTime * 0.14;

    vec2 q = vec2(
      fbm(uv * 3.0 + t),
      fbm(uv * 3.0 + vec2(3.8, 1.6) + t * 0.9)
    );
    vec2 r = vec2(
      fbm(uv * 3.0 + 3.2 * q + vec2(2.1, 8.9) + t * 0.65),
      fbm(uv * 3.0 + 3.2 * q + vec2(7.4, 3.1) + t * 0.45)
    );
    float f = fbm(uv * 3.0 + 3.8 * r + t * 0.2);

    vec3 col = grad(f);
    col = mix(col, ${S4}, smoothstep(0.62, 0.82, f * f));
    col = mix(col, ${S5}, smoothstep(0.80, 0.94, f * f * f));

    float cx = exp(-pow(uv.x - 0.5, 2.0) * 3.0) * 0.35 + 0.65;
    float cy = exp(-pow(uv.y - 0.48, 2.0) * 2.0) * 0.30 + 0.70;
    col *= cx * cy;

    vec2 vd = uv - 0.5;
    col *= 1.0 - dot(vd * 1.4, vd * 1.4);
    col  = pow(max(col, 0.0), vec3(0.82));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── Helpers ────────────────────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (process.env.NODE_ENV !== 'production' && !gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

function buildProgram(gl: WebGLRenderingContext) {
  const vs  = compileShader(gl, gl.VERTEX_SHADER,   VERT);
  const fs  = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);
  return { prog, vs, fs };
}

// ── Component ──────────────────────────────────────────────────────────────────
const Background3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Raw WebGL — no Three.js, no framework issues
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    } catch {
      // WebGL context creation failed (e.g. blocked by browser or hardware)
      gl = null;
    }
    if (!gl) return;

    const { prog, vs, fs } = buildProgram(gl);

    // Full-screen quad (2 triangles as TRIANGLE_STRIP)
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1]), gl.STATIC_DRAW);

    const posLoc    = gl.getAttribLocation(prog,  'position');
    const uTimeLoc  = gl.getUniformLocation(prog, 'uTime');
    const uAspectLoc= gl.getUniformLocation(prog, 'uAspect');

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Mobile: 0.35× — desktop: 0.5× (FBM noise is smooth, upscaling invisible)
    const isMobile = () => window.innerWidth < 768;
    const resize = () => {
      const scale = isMobile() ? 0.35 : 0.5;
      // visualViewport gives stable height on iOS (excludes address bar)
      const vw = window.visualViewport?.width  ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      canvas.width  = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Desktop → 1.0 (neutre, shader identique à avant)
      // Mobile  → ratio réel pour corriger le portrait
      gl.uniform1f(uAspectLoc, isMobile() ? canvas.width / canvas.height : 1.0);
    };
    resize();

    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);

    // Render loop — fade in canvas after first frame to hide shader compilation delay
    let rafId: number;
    const t0 = performance.now();
    let firstFrame = true;

    const render = () => {
      rafId = requestAnimationFrame(render);
      gl.uniform1f(uTimeLoc, (performance.now() - t0) / 1000);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (firstFrame) {
        firstFrame = false;
        canvas.style.opacity = '1';
      }
    };
    render();

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        cancelAnimationFrame(rafId);
        render();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
        opacity: 0,
        transition: 'opacity 0.7s ease',
        backgroundColor: '#020108',
      }}
    />
  );
};

export default Background3D;
