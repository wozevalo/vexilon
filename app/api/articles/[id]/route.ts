import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/serverAuth';
import { Article } from '@/lib/types';

const DATA_PATH = join(process.cwd(), 'data', 'articles.json');

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

/** DELETE /api/articles/[id] — protected */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const articles = readArticles();
  const article = articles.find((a) => a.id === params.id);

  if (!article) {
    return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
  }

  // Remove image file
  if (article.imagePath) {
    const imgPath = join(process.cwd(), 'public', article.imagePath);
    if (existsSync(imgPath)) {
      try { unlinkSync(imgPath); } catch { /* ignore */ }
    }
  }

  writeArticles(articles.filter((a) => a.id !== params.id));
  return NextResponse.json({ ok: true });
}
