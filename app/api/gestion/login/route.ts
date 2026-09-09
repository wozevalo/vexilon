import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
} from '@/lib/serverAuth';
import { clientKey, retryAfter, recordFailure, recordSuccess } from '@/lib/loginThrottle';

export async function POST(request: NextRequest) {
  const key = clientKey(request.headers);

  // Blocage temporaire après une série d'échecs
  const wait = retryAfter(key);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${Math.ceil(wait / 60)} minute(s).` },
      { status: 429, headers: { 'Retry-After': String(wait) } }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 });
  }

  if (!verifyAdminCredentials(email, password)) {
    recordFailure(key);
    // Message volontairement identique quel que soit le champ erroné :
    // distinguer les deux révélerait quels e-mails existent.
    return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
  }

  recordSuccess(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    // Aligné sur la validité du jeton lui-même, désormais vérifiée au serveur
    maxAge: SESSION_MAX_AGE_MS / 1000,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
