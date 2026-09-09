import { toEmbedUrl } from './media';

/**
 * Conversion Markdown → HTML, sans dépendance.
 *
 * Le HTML produit est volontairement limité aux balises que l'éditeur du
 * back-office sait manipuler et que lib/sanitizeHtml.ts laisse passer.
 * Tout ce qui n'a pas d'équivalent (tableaux, HTML brut) est signalé à
 * l'utilisateur plutôt que supprimé en silence.
 */

export interface MarkdownStats {
  headings: number;
  links: number;
  images: number;
  embeds: number;
  /** Images écartées : chemin local impossible à afficher sur le site */
  skippedImages: string[];
  /** Tableaux convertis */
  tables: number;
  /** Le fichier contenait du HTML brut, affiché tel quel */
  hadRawHtml: boolean;
}

export interface MarkdownImportResult {
  html: string;
  stats: MarkdownStats;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Une image doit pointer sur /uploads, /img ou une URL absolue */
function isUsableMediaUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || /^\/(uploads|img)\//.test(url);
}

function isUsableLinkUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(url);
}

interface InlineContext {
  stats: MarkdownStats;
  host?: string;
}

/**
 * Met en forme le contenu d'une ligne (gras, liens, images…).
 *
 * Les fragments déjà convertis sont mis de côté sous forme de jetons
 * `@@n@@` pour que les règles suivantes ne retravaillent pas le HTML
 * qu'on vient de produire.
 */
function renderInline(raw: string, context: InlineContext): string {
  const tokens: string[] = [];
  const stash = (html: string) => '@@' + (tokens.push(html) - 1) + '@@';

  let text = escapeHtml(raw);

  // `code` — la balise n'existe pas dans l'éditeur, on garde le texte seul
  text = text.replace(/`([^`]+)`/g, (_match, code) => stash(String(code)));

  // ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, alt, url) => {
    const target = String(url);
    if (!isUsableMediaUrl(target)) {
      context.stats.skippedImages.push(target);
      return stash(escapeHtml(String(alt) || target));
    }
    context.stats.images++;
    return stash('<img src="' + target + '" alt="' + String(alt) + '" />');
  });

  // [texte](url)
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
    const target = String(url);
    if (!isUsableLinkUrl(target)) return match;
    context.stats.links++;
    const external = /^https?:\/\//i.test(target);
    return stash(
      '<a href="' + target + '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
        '>' + renderInline(String(label), context) + '</a>'
    );
  });

  // URL écrite telle quelle → lien cliquable
  text = text.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_match, before, url) => {
    context.stats.links++;
    const clean = String(url).replace(/[.,;:]$/, '');
    const trailing = String(url).slice(clean.length);
    return (
      String(before) +
      stash('<a href="' + clean + '" target="_blank" rel="noopener noreferrer">' + clean + '</a>') +
      trailing
    );
  });

  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>');

  return text.replace(/@@(\d+)@@/g, (_match, index) => tokens[Number(index)] ?? '');
}

const HEADING = /^(#{1,4})\s+(.*)$/;
const HORIZONTAL_RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const UNORDERED = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const RAW_HTML = /^\s*<\/?[a-zA-Z][^>]*>/;

/* ── Tableaux ─────────────────────────────────────────────────────────── */

/** « | a | b | » → ['a', 'b'] */
function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/** Ligne de séparation « | --- | :---: | » qui suit l'en-tête */
function isDelimiterRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

/** Alignement demandé par la ligne de séparation */
function alignmentOf(cell: string): string {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return ' style="text-align: center"';
  if (right) return ' style="text-align: right"';
  return '';
}

function renderTable(rows: string[][], context: InlineContext): string {
  let header: string[] | null = null;
  let alignments: string[] = [];
  let body = rows;

  if (rows.length >= 2 && isDelimiterRow(rows[1])) {
    header = rows[0];
    alignments = rows[1].map(alignmentOf);
    body = rows.slice(2);
  }

  const columns = Math.max(header ? header.length : 0, ...body.map((row) => row.length), 1);
  const align = (index: number) => alignments[index] || '';

  const cells = (row: string[], tag: 'th' | 'td') => {
    const out: string[] = [];
    for (let i = 0; i < columns; i++) {
      out.push(
        '<' + tag + align(i) + '>' + renderInline(row[i] || '', context) + '</' + tag + '>'
      );
    }
    return '<tr>' + out.join('') + '</tr>';
  };

  const head = header ? '<thead>' + cells(header, 'th') + '</thead>' : '';
  const rest = body.length
    ? '<tbody>' + body.map((row) => cells(row, 'td')).join('') + '</tbody>'
    : '';

  // <figure> sert de conteneur défilant sur mobile (voir globals.css)
  return '<figure><table>' + head + rest + '</table></figure>';
}

/** Convertit un document Markdown en HTML prêt pour l'éditeur. */
export function markdownToHtml(markdown: string, host?: string): MarkdownImportResult {
  const stats: MarkdownStats = {
    headings: 0,
    links: 0,
    images: 0,
    embeds: 0,
    skippedImages: [],
    tables: 0,
    hadRawHtml: false,
  };
  const context: InlineContext = { stats, host };

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let paragraph: string[] = [];
  let inCodeFence = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const body = paragraph.map((line) => renderInline(line, context)).join('<br />');
    out.push('<p>' + body + '</p>');
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bloc de code : le contenu est conservé en texte, sans coloration
    if (/^\s*```/.test(line)) {
      flushParagraph();
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) {
      paragraph.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    if (TABLE_ROW.test(line)) {
      flushParagraph();
      const rows: string[][] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      i--; // la boucle principale ré-incrémente
      stats.tables++;
      out.push(renderTable(rows, context));
      continue;
    }

    if (HORIZONTAL_RULE.test(line)) {
      flushParagraph();
      out.push('<hr />');
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      stats.headings++;
      out.push('<h' + level + '>' + renderInline(heading[2], context) + '</h' + level + '>');
      continue;
    }

    // Lien vidéo seul sur sa ligne → intégration
    const alone = line.trim();
    if (/^https?:\/\/\S+$/.test(alone)) {
      const embedUrl = toEmbedUrl(alone, host);
      if (embedUrl) {
        flushParagraph();
        stats.embeds++;
        out.push(
          '<figure><iframe src="' + embedUrl + '" title="Vidéo" allowfullscreen></iframe></figure>'
        );
        continue;
      }
    }

    // Image seule sur sa ligne → figure
    const loneImage = alone.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (loneImage && isUsableMediaUrl(loneImage[2])) {
      flushParagraph();
      stats.images++;
      out.push(
        '<figure><img src="' + loneImage[2] + '" alt="' + escapeHtml(loneImage[1]) + '" /></figure>'
      );
      continue;
    }

    // Listes : on regroupe les lignes consécutives de même nature
    if (UNORDERED.test(line) || ORDERED.test(line)) {
      flushParagraph();
      const ordered = ORDERED.test(line);
      const pattern = ordered ? ORDERED : UNORDERED;
      const entries: string[] = [];

      while (i < lines.length && pattern.test(lines[i])) {
        const match = lines[i].match(pattern);
        if (match) entries.push('<li>' + renderInline(match[1], context) + '</li>');
        i++;
      }
      i--; // la boucle principale ré-incrémente

      const tag = ordered ? 'ol' : 'ul';
      out.push('<' + tag + '>' + entries.join('') + '</' + tag + '>');
      continue;
    }

    if (QUOTE.test(line)) {
      flushParagraph();
      const entries: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        const match = lines[i].match(QUOTE);
        if (match) entries.push(renderInline(match[1], context));
        i++;
      }
      i--;
      out.push('<blockquote>' + entries.join('<br />') + '</blockquote>');
      continue;
    }

    if (RAW_HTML.test(line)) stats.hadRawHtml = true;

    paragraph.push(line);
  }

  flushParagraph();

  return { html: out.join(''), stats };
}

/** Phrase de compte rendu affichée après un import. */
export function describeImport(stats: MarkdownStats): string {
  const parts: string[] = [];
  if (stats.headings) parts.push(stats.headings + ' titre' + (stats.headings > 1 ? 's' : ''));
  if (stats.links) parts.push(stats.links + ' lien' + (stats.links > 1 ? 's' : ''));
  if (stats.images) parts.push(stats.images + ' image' + (stats.images > 1 ? 's' : ''));
  if (stats.embeds) parts.push(stats.embeds + ' vidéo' + (stats.embeds > 1 ? 's' : '') + ' intégrée' + (stats.embeds > 1 ? 's' : ''));
  if (stats.tables) parts.push(stats.tables + ' tableau' + (stats.tables > 1 ? 'x' : ''));

  let message = parts.length ? 'Import réussi : ' + parts.join(', ') + '.' : 'Import réussi.';

  if (stats.skippedImages.length) {
    message +=
      ' ' + stats.skippedImages.length + ' image' + (stats.skippedImages.length > 1 ? 's' : '') +
      ' ignorée' + (stats.skippedImages.length > 1 ? 's' : '') +
      " (chemin local introuvable en ligne) — ajoutez-les avec le bouton image de la barre d'outils.";
  }
  if (stats.hadRawHtml) {
    message += ' Le HTML brut du fichier a été affiché comme du texte.';
  }

  return message;
}
