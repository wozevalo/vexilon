/** @type {import('next').NextConfig} */

/*
 * Politique de sécurité du contenu.
 *
 * `unsafe-inline` reste nécessaire pour les scripts : Next injecte son
 * amorçage en ligne, et layout.tsx pose le thème avant le premier affichage
 * pour éviter le clignotement. En revanche `connect-src 'self'` empêche
 * l'exfiltration vers un domaine tiers, et `object-src`/`base-uri` ferment
 * deux vecteurs classiques. C'est une seconde ligne de défense derrière
 * lib/sanitizeHtml.ts, pas un remplacement.
 */
const EMBED_HOSTS = [
  'https://www.youtube-nocookie.com',
  'https://player.twitch.tv',
  'https://clips.twitch.tv',
  'https://player.vimeo.com',
  'https://www.dailymotion.com',
].join(' ');

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://i.ytimg.com https://picsum.photos",
  "media-src 'self' blob:",
  `frame-src ${EMBED_HOSTS}`,
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig = {
  // L'en-tête « X-Powered-By: Next.js » annonce la pile sans rien apporter.
  poweredByHeader: false,

  images: {
    // AVIF d'abord : ~30 % de moins que WebP à qualité égale, replié
    // automatiquement sur WebP puis sur l'original selon le navigateur.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        // Vignettes d'apercu des integrations YouTube (lib/media.ts).
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },

  experimental: {
    // N'embarque que les icônes réellement importées au lieu du paquet entier.
    optimizePackageImports: ['lucide-react'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // Les fichiers déposés portent un UUID : leur contenu ne change
        // jamais pour une même URL, ils peuvent donc être mis en cache
        // définitivement par le navigateur et les intermédiaires.
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;
