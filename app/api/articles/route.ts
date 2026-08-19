import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/serverAuth';
import { Article } from '@/lib/types';

const DATA_PATH = join(process.cwd(), 'data', 'articles.json');
const UPLOADS_PATH = join(process.cwd(), 'public', 'uploads');

function readArticles(): Article[] {
  if (!existsSync(DATA_PATH)) return [];
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeArticles(articles: Article[]) {
  writeFileSync(DATA_PATH, JSON.stringify(articles, null, 2));
}

/** GET /api/articles — public, returns all articles sorted by date */
export async function GET() {
  const articles = readArticles().sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return NextResponse.json(articles);
}

/** POST /api/articles — protected, creates a new article with image upload */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string | null;
  const image = formData.get('image') as File | null;

  if (!title?.trim() || !image) {
    return NextResponse.json({ error: 'Titre et image requis.' }, { status: 400 });
  }

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  if (!ALLOWED_MIME_TYPES.includes(image.type)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP, GIF.' }, { status: 400 });
  }

  if (image.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux. Taille maximale : 10 Mo.' }, { status: 400 });
  }

  // Save image to public/uploads/
  if (!existsSync(UPLOADS_PATH)) mkdirSync(UPLOADS_PATH, { recursive: true });

  const ext = image.name.split('.').pop() || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const bytes = await image.arrayBuffer();
  writeFileSync(join(UPLOADS_PATH, filename), Buffer.from(bytes));

  const article: Article = {
    id: randomUUID(),
    title: title.trim(),
    content: content?.trim() || undefined,
    imagePath: `/uploads/${filename}`,
    publishedAt: new Date().toISOString(),
  };

  const articles = readArticles();
  articles.push(article);
  writeArticles(articles);

  return NextResponse.json(article, { status: 201 });
}
