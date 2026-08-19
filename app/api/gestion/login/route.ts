import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, createSessionToken, SESSION_COOKIE } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 });
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ ok: true });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
