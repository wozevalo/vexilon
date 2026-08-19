import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'vexilon_session';
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}
const SESSION_SECRET = process.env.SESSION_SECRET;

async function verifySessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return false;
  const id = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return sig === expected;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/gestion/blog')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.redirect(new URL('/gestion', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/gestion/blog/:path*'],
};
