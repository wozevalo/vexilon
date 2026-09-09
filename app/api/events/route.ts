import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/serverAuth';
import { getAllEvents, getEventsForAdmin, createEvent } from '@/lib/eventsStore';

export const dynamic = 'force-dynamic';

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return Boolean(token && verifySessionToken(token));
}

/** GET /api/events — public. `?all=1` (authentifié) conserve l'ordre du back-office. */
export async function GET(request: NextRequest) {
  const wantsAdminOrder = request.nextUrl.searchParams.get('all') === '1';
  const events = wantsAdminOrder && isAuthenticated(request) ? getEventsForAdmin() : getAllEvents();
  return NextResponse.json(events, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

/** POST /api/events — protégé. Crée un événement. */
export async function POST(request: NextRequest) {
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

  const event = createEvent(body);
  return NextResponse.json(event, { status: 201 });
}
