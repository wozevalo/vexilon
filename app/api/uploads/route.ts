import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/serverAuth';
import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  matchesDeclaredType,
  extensionForMime,
} from '@/lib/media';

export const dynamic = 'force-dynamic';

const UPLOADS_PATH = join(process.cwd(), 'public', 'uploads');

/**
 * POST /api/uploads — protégé.
 * Reçoit un fichier image ou vidéo et renvoie { path, type }.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }

  const isImage = IMAGE_MIME_TYPES.includes(file.type);
  const isVideo = VIDEO_MIME_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: 'Format non autorisé. Images : JPEG, PNG, WebP, GIF, AVIF. Vidéos : MP4, WebM, OGG, MOV.' },
      { status: 400 }
    );
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    const limit = Math.round(maxSize / (1024 * 1024));
    return NextResponse.json(
      { error: 'Fichier trop volumineux. Taille maximale : ' + limit + ' Mo.' },
      { status: 400 }
    );
  }

  if (!existsSync(UPLOADS_PATH)) mkdirSync(UPLOADS_PATH, { recursive: true });

  const extension = extensionForMime(file.type);
  const filename = randomUUID() + '.' + extension;

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: 'Lecture du fichier impossible.' }, { status: 400 });
  }

  // Le type MIME reçu est déclaré par le client : on confronte les premiers
  // octets au type annoncé avant d'écrire quoi que ce soit sur le disque.
  if (!matchesDeclaredType(new Uint8Array(bytes.slice(0, 16)), file.type)) {
    return NextResponse.json(
      { error: "Le contenu du fichier ne correspond pas à son type. Fichier refusé." },
      { status: 400 }
    );
  }

  try {
    writeFileSync(join(UPLOADS_PATH, filename), Buffer.from(bytes));
  } catch {
    return NextResponse.json({ error: "Échec de l'enregistrement du fichier." }, { status: 500 });
  }

  return NextResponse.json(
    { path: '/uploads/' + filename, type: isImage ? 'image' : 'video' },
    { status: 201 }
  );
}
