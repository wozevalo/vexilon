import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'vexilon_session';
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}
const SESSION_SECRET = process.env.SESSION_SECRET;

/**
 * Doit rester le miroir exact de lib/serverAuth.ts.
 *
 * Le middleware s'exécute dans le runtime Edge, qui n'a pas le module
 * `crypto` de Node : la signature est donc refaite avec l'API Web Crypto.
 * Toute évolution du format de jeton doit être répercutée dans les deux.
 */
async function verifySessionToken(token: string): Promise<boolean> {
  if (!token) return false;

  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (!safeEqual(signature, expected)) return false;

  // Jetons à deux segments : format antérieur à l'expiration, refusés.
  const separator = payload.lastIndexOf('.');
  if (separator === -1) return false;

  const expiresAt = Number(payload.slice(separator + 1));
  if (!Number.isFinite(expiresAt)) return false;

  return Date.now() < expiresAt;
}

/** Comparaison à durée constante, sans dépendre du module crypto de Node */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/gestion/blog') || pathname.startsWith('/gestion/evenements')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.redirect(new URL('/gestion', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/gestion/blog/:path*', '/gestion/evenements/:path*'],
};
