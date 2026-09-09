import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { writeJsonAtomic } from '@/lib/jsonFile';
import { join } from 'path';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/serverAuth';
import { Article } from '@/lib/types';
import { deleteUploadsIfUnused } from '@/lib/uploadsUsage';

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
  writeJsonAtomic(DATA_PATH, articles);
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

  writeArticles(articles.filter((a) => a.id !== params.id));

  // Le dossier /uploads est partagé avec les événements : on n'efface l'image
  // que si plus personne ne l'utilise (à faire après l'écriture du JSON).
  if (article.imagePath) deleteUploadsIfUnused([article.imagePath]);

  return NextResponse.json({ ok: true });
}
