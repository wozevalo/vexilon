import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/serverAuth';
import { findEvent, updateEvent, deleteEvent } from '@/lib/eventsStore';

export const dynamic = 'force-dynamic';

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return Boolean(token && verifySessionToken(token));
}

/** GET /api/events/[id] — public. Accepte un id ou un slug. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const event = findEvent(params.id);
  if (!event) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }
  return NextResponse.json(event, { headers: { 'Cache-Control': 'no-store' } });
}

/** PUT /api/events/[id] — protégé. Met à jour un événement. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (typeof body?.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Le titre est obligatoire.' }, { status: 400 });
  }
  if (typeof body?.startDate !== 'string' || Number.isNaN(new Date(body.startDate).getTime())) {
    return NextResponse.json({ error: 'La date de début est obligatoire.' }, { status: 400 });
  }

  const updated = updateEvent(params.id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

/** DELETE /api/events/[id] — protégé. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  if (!deleteEvent(params.id)) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
