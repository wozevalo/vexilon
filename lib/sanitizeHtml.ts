/**
 * Assainisseur HTML minimaliste, sans dépendance.
 *
 * Le back-office produit du HTML riche (titres, liens, images, vidéos). Ce HTML
 * est ensuite rendu via dangerouslySetInnerHTML : il DOIT donc passer par cette
 * fonction côté serveur avant d'être stocké. Tout ce qui n'est pas explicitement
 * autorisé est supprimé (balises inconnues, scripts, handlers on*, javascript:).
 */

/** Balises autorisées → liste blanche d'attributs */
const ALLOWED_TAGS: Record<string, string[]> = {
  h1: [], h2: [], h3: [], h4: [],
  p: [], br: [], hr: [],
  strong: [], b: [], em: [], i: [], u: [], s: [], mark: [], small: [],
  ul: [], ol: [], li: [],
  blockquote: [],
  figure: [], figcaption: [],
  table: [], thead: [], tbody: [], tfoot: [], caption: [],
  tr: [], th: ['style'], td: ['style'],
  a: ['href', 'target', 'rel'],
  span: ['style'],
  div: ['style'],
  img: ['src', 'alt', 'style'],
  video: ['src', 'controls', 'poster', 'style'],
  iframe: ['src', 'title', 'allow', 'allowfullscreen', 'style'],
};

const VOID_TAGS = new Set(['br', 'hr', 'img']);

/** Balises dont le contenu entier est supprimé (pas seulement la balise) */
const STRIP_WITH_CONTENT = /<(script|style|noscript|template|object|embed)\b[\s\S]*?<\/\1\s*>/gi;

/** Propriétés CSS autorisées dans un attribut style */
const ALLOWED_CSS_PROPS = new Set([
  'font-size',
  'font-weight',
  'font-style',
  'text-align',
  'text-decoration',
  'max-width',
  'width',
]);

/** Hôtes autorisés pour les iframes d'intégration vidéo */
const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.twitch.tv',
  'clips.twitch.tv',
  'player.vimeo.com',
  'www.dailymotion.com',
  'geo.dailymotion.com',
]);

function escapeText(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Décode les entités courantes pour empêcher un contournement du filtre d'URL */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/gi, '&')
    .replace(/&colon;/gi, ':');
}

/** Retire espaces et caractères de contrôle, utilisés pour masquer un "javascript:" */
function stripBlanks(value: string): string {
  return Array.from(value)
    .filter((ch) => ch.charCodeAt(0) > 32 && ch.charCodeAt(0) !== 127)
    .join("");
}

/** Autorise http(s), mailto, ancres et chemins relatifs — rien d'autre */
function isSafeUrl(raw: string): boolean {
  const url = stripBlanks(decodeEntities(raw));
  if (!url) return false;
  if (url.startsWith('//')) return false;
  if (url.startsWith('/') || url.startsWith('#')) return true;
  return /^(https?:|mailto:)/i.test(url);
}

/** src d'un média : chemin local sous /public ou URL https */
function isSafeMediaUrl(raw: string): boolean {
  const url = decodeEntities(raw).trim();
  if (url.startsWith('//')) return false;
  if (url.startsWith('/')) return true;
  return /^https:\/\//i.test(url);
}

function isAllowedIframeSrc(raw: string): boolean {
  const url = decodeEntities(raw).trim();
  if (!/^https:\/\//i.test(url)) return false;
  try {
    return ALLOWED_IFRAME_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function sanitizeStyle(raw: string): string {
  const value = decodeEntities(raw);
  if (/url\s*\(|expression\s*\(|javascript:|@import|<|behavior\s*:/i.test(value)) return '';

  return value
    .split(';')
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(':');
      if (idx === -1) return null;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const val = decl.slice(idx + 1).trim();
      if (!ALLOWED_CSS_PROPS.has(prop)) return null;
      if (!/^[a-z0-9 .,%#()/-]+$/i.test(val)) return null;
      return `${prop}: ${val}`;
    })
    .filter(Boolean)
    .join('; ');
}

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g;

/** Marqueur interne : la balise entière doit être supprimée */
const DROP_TAG = "__VEXILON_DROP_TAG__";

function sanitizeAttributes(tag: string, rawAttrs: string): string {
  const allowed = ALLOWED_TAGS[tag];
  const out: string[] = [];
  let match: RegExpExecArray | null;

  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';

    if (name.startsWith('on')) continue;
    if (!allowed.includes(name)) continue;

    if (name === 'href') {
      if (!isSafeUrl(value)) continue;
      out.push('href="' + escapeAttr(value.trim()) + '"');
      continue;
    }

    if (name === 'src') {
      if (tag === 'iframe') {
        if (!isAllowedIframeSrc(value)) return DROP_TAG;
      } else if (!isSafeMediaUrl(value)) {
        return DROP_TAG;
      }
      out.push('src="' + escapeAttr(value.trim()) + '"');
      continue;
    }

    if (name === 'poster') {
      if (!isSafeMediaUrl(value)) continue;
      out.push('poster="' + escapeAttr(value.trim()) + '"');
      continue;
    }

    if (name === 'style') {
      const style = sanitizeStyle(value);
      if (style) out.push('style="' + escapeAttr(style) + '"');
      continue;
    }

    if (name === 'target') {
      out.push('target="_blank"');
      continue;
    }

    if (name === 'controls' || name === 'allowfullscreen') {
      out.push(name);
      continue;
    }

    out.push(name + '="' + escapeAttr(value) + '"');
  }

  // Un lien ouvert dans un nouvel onglet doit être isolé de la page d'origine
  if (tag === 'a') {
    const hasTarget = out.some((a) => a.startsWith('target='));
    if (hasTarget && !out.some((a) => a.startsWith('rel='))) {
      out.push('rel="noopener noreferrer"');
    }
  }
  const hasSrc = out.some((a) => a.startsWith('src='));
  if (tag === 'video') {
    if (!hasSrc) return DROP_TAG;
    if (!out.includes('controls')) out.push('controls');
  }
  if (tag === 'img' && !hasSrc) return DROP_TAG;
  if (tag === 'iframe') {
    if (!hasSrc) return DROP_TAG;
    if (!out.includes('allowfullscreen')) out.push('allowfullscreen');
  }

  return out.length ? ' ' + out.join(' ') : '';
}

const TAG_RE = /<(\/)?([a-zA-Z][a-zA-Z0-9]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)\/?>/g;

/** Nettoie du HTML issu de l'éditeur. Retourne du HTML sûr à injecter. */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  const html = input.replace(/<!--[\s\S]*?-->/g, '').replace(STRIP_WITH_CONTENT, '');

  const openStack: string[] = [];
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(html)) !== null) {
    result += escapeText(html.slice(lastIndex, match.index));
    lastIndex = TAG_RE.lastIndex;

    const isClosing = Boolean(match[1]);
    const tag = match[2].toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_TAGS, tag)) continue;

    if (isClosing) {
      if (VOID_TAGS.has(tag)) continue;
      const idx = openStack.lastIndexOf(tag);
      if (idx === -1) continue; // fermeture orpheline
      // Referme aussi les balises restées ouvertes à l'intérieur
      while (openStack.length > idx) {
        result += '</' + openStack.pop() + '>';
      }
      continue;
    }

    const attrs = sanitizeAttributes(tag, match[3] || '');
    if (attrs === DROP_TAG) continue;

    if (VOID_TAGS.has(tag)) {
      result += '<' + tag + attrs + ' />';
    } else {
      openStack.push(tag);
      result += '<' + tag + attrs + '>';
    }
  }

  result += escapeText(html.slice(lastIndex));

  // Referme les balises laissées ouvertes
  while (openStack.length) {
    result += '</' + openStack.pop() + '>';
  }

  return result.trim();
}

/**
 * Convertit du HTML en texte brut (résumés, meta description).
 *
 * ATTENTION — la sortie est du TEXTE, jamais du HTML. Cette fonction décode
 * les entités : `&lt;` redevient `<`. Du contenu que sanitizeHtml avait
 * neutralisé ressort donc ici sous forme de caractères actifs. Le résultat
 * doit toujours passer par un échappement adapté au contexte de destination
 * (JSX, qui échappe seul, ou lib/jsonLd.ts pour une balise <script>), et
 * ne jamais être injecté tel quel via dangerouslySetInnerHTML.
 */
export function htmlToText(input: string, maxLength = 0): string {
  const text = input
    .replace(STRIP_WITH_CONTENT, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (maxLength > 0 && text.length > maxLength) {
    return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
  }
  return text;
}
