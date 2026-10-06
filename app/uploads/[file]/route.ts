import { NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join, sep, normalize, extname } from 'path';
import { Readable } from 'stream';
import { mimeForExtension } from '@/lib/media';

export const dynamic = 'force-dynamic';

const UPLOADS_PATH = join(process.cwd(), 'public', 'uploads');

/** Nom de fichier tel que nous l'ecrivons : un UUID, un point, une extension. */
const FILENAME = /^[A-Za-z0-9._-]+$/;

/**
 * GET /uploads/<fichier> — sert un media depose par le back-office.
 *
 * Pourquoi cette route alors que les fichiers sont dans public/ :
 *
 * Next.js dresse la liste de public/ une seule fois, au demarrage du serveur
 * (publicFolderItems, dans router-utils/filesystem.js), et ne la rafraichit
 * jamais en production. Une image deposee par le back-office sur un serveur
 * deja lance restait donc introuvable — 404 — jusqu'au prochain redemarrage,
 * ce qui faisait echouer l'optimiseur d'images avec « received null ».
 *
 * Les fichiers presents au demarrage continuent d'etre servis directement par
 * Next, qui est plus rapide ; seuls les nouveaux arrivent ici. Au redemarrage
 * suivant ils rejoignent la liste statique et cette route cesse de les voir.
 */
export async function GET(
  request: Request,
  { params }: { params: { file: string } }
) {
  const file = params.file;

  // Un seul segment, et uniquement les caracteres que nous produisons.
  // `..` est ainsi exclu, de meme que tout separateur de chemin.
  if (!file || !FILENAME.test(file) || file.includes('..')) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Seules les extensions que nous avons nous-memes ecrites sont servies :
  // rien ici ne peut etre diffuse comme du HTML ou du script.
  const contentType = mimeForExtension(extname(file).slice(1));
  if (!contentType) {
    return new NextResponse('Not found', { status: 404 });
  }

  const absolute = normalize(join(UPLOADS_PATH, file));

  // Ceinture et bretelles : apres resolution, le chemin doit rester sous
  // public/uploads. Le separateur final evite qu'un dossier voisin nomme
  // « uploads-autre » passe le test de prefixe.
  if (!absolute.startsWith(UPLOADS_PATH + sep)) {
    return new NextResponse('Not found', { status: 404 });
  }

  let size: number;
  try {
    const stats = statSync(absolute);
    if (!stats.isFile()) return new NextResponse('Not found', { status: 404 });
    size = stats.size;
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    // Le nom porte un UUID : le contenu d'une URL ne change jamais.
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    // Indispensable aux videos : sans cela, pas de deplacement dans la
    // timeline, et Safari refuse purement et simplement de lire.
    'Accept-Ranges': 'bytes',
  };

  const range = request.headers.get('range');
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;

  if (match && (match[1] !== '' || match[2] !== '')) {
    // « bytes=-500 » demande les 500 derniers octets, « bytes=500- » la suite
    // a partir de 500.
    const suffix = match[1] === '';
    const start = suffix
      ? Math.max(0, size - Number(match[2]))
      : Number(match[1]);
    const end = suffix || match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);

    if (!Number.isFinite(start) || start > end || start >= size) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': 'bytes */' + size, 'Accept-Ranges': 'bytes' },
      });
    }

    // Flux plutot que lecture complete en memoire : certaines videos pesent
    // plusieurs dizaines de Mo.
    const partial = Readable.toWeb(
      createReadStream(absolute, { start, end })
    ) as ReadableStream;

    return new NextResponse(partial, {
      status: 206,
      headers: {
        ...headers,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
        'Content-Length': String(end - start + 1),
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(absolute)) as ReadableStream;

  return new NextResponse(stream, {
    headers: { ...headers, 'Content-Length': String(size) },
  });
}
