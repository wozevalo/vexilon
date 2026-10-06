/** Helpers média partagés entre le back-office et les pages publiques. */

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 Mo
// 200 Mo laissait passer des fichiers impossibles a servir correctement :
// une video de 58 Mo part telle quelle sur le reseau, sans transcodage.
export const MAX_VIDEO_SIZE = 40 * 1024 * 1024; // 40 Mo

/**
 * Extension déduite du type MIME. Le nom de fichier fourni par le client
 * n'est jamais utilisé : il permettrait d'écrire un `.html` dans
 * public/uploads, servi ensuite comme contenu actif sur l'origine du site.
 */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
};

export function extensionForMime(mime: string): string {
  return EXTENSION_BY_MIME[mime] || 'bin';
}

/**
 * Type MIME d'un fichier deja depose, deduit de son extension.
 *
 * Table inverse de EXTENSION_BY_MIME : seules les extensions que nous avons
 * nous-memes ecrites sont reconnues. Tout le reste renvoie null et n'est pas
 * servi — un fichier arrive la par un autre chemin ne peut donc pas etre
 * diffuse comme du contenu actif.
 */
const MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSION_BY_MIME).map(([mime, ext]) => [ext, mime])
);

export function mimeForExtension(extension: string): string | null {
  return MIME_BY_EXTENSION[extension.toLowerCase()] || null;
}

/** Extensions considérées comme vidéo pour un chemin /uploads/... */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov'];

export function isVideoPath(path: string): boolean {
  const lower = path.toLowerCase().split('?')[0];
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Convertit une URL YouTube / Twitch / Vimeo / Dailymotion en URL d'intégration.
 * Retourne null si la plateforme n'est pas reconnue.
 *
 * `host` sert au paramètre `parent` exigé par Twitch (nom de domaine du site).
 */
export function toEmbedUrl(rawUrl: string, host?: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

  // YouTube — youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID, /live/ID
  if (hostname === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) : null;
  }
  if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com' || hostname === 'm.youtube.com') {
    const v = url.searchParams.get('v');
    if (v) return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v);
    const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
    if (match) return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(match[2]);
    return null;
  }

  // Twitch — chaîne, vidéo ou clip (le paramètre parent est obligatoire)
  if (hostname === 'twitch.tv') {
    const parent = (host || 'localhost').replace(/:\d+$/, '');
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'videos' && segments[1]) {
      return 'https://player.twitch.tv/?video=' + encodeURIComponent(segments[1]) + '&parent=' + parent;
    }
    if (segments[1] === 'clip' && segments[2]) {
      return 'https://clips.twitch.tv/embed?clip=' + encodeURIComponent(segments[2]) + '&parent=' + parent;
    }
    if (segments[0]) {
      return 'https://player.twitch.tv/?channel=' + encodeURIComponent(segments[0]) + '&parent=' + parent;
    }
    return null;
  }
  if (hostname === 'clips.twitch.tv') {
    const parent = (host || 'localhost').replace(/:\d+$/, '');
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? 'https://clips.twitch.tv/embed?clip=' + encodeURIComponent(id) + '&parent=' + parent : null;
  }

  // Vimeo
  if (hostname === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? 'https://player.vimeo.com/video/' + id : null;
  }
  if (hostname === 'player.vimeo.com') return url.toString();

  // Dailymotion
  if (hostname === 'dailymotion.com') {
    const match = url.pathname.match(/^\/video\/([^/?#]+)/);
    return match ? 'https://www.dailymotion.com/embed/video/' + encodeURIComponent(match[1]) : null;
  }
  if (hostname === 'dai.ly') {
    const id = url.pathname.slice(1);
    return id ? 'https://www.dailymotion.com/embed/video/' + encodeURIComponent(id) : null;
  }

  return null;
}

/** Nom lisible de la plateforme d'une URL d'intégration */
export function embedPlatform(rawUrl: string): string {
  const lower = rawUrl.toLowerCase();
  if (lower.includes('youtu')) return 'YouTube';
  if (lower.includes('twitch')) return 'Twitch';
  if (lower.includes('vimeo')) return 'Vimeo';
  if (lower.includes('dailymotion') || lower.includes('dai.ly')) return 'Dailymotion';
  return 'Vidéo';
}

/** Un nom d'hôte, et rien d'autre : ni guillemet, ni chevron, ni espace. */
const HOSTNAME = /^[a-z0-9.-]+$/i;

/**
 * Réécrit le paramètre `parent` des iframes Twitch avec le domaine courant.
 *
 * Une intégration Twitch enregistrée depuis localhost garderait sinon
 * `parent=localhost` et refuserait de s'afficher en production.
 *
 * Deux précautions :
 *
 * 1. `host` vient de l'en-tête HTTP Host, donc du client. Il est recopié
 *    dans un attribut d'un HTML déjà sérialisé — c'est-à-dire APRÈS
 *    sanitizeHtml, hors de sa protection. Un guillemet y refermerait
 *    l'attribut. On refuse donc tout ce qui n'est pas un nom de domaine.
 *
 * 2. Le HTML stocké a été sérialisé par le sanitizer, qui échappe `&` en
 *    `&amp;`. Chercher `&parent=` ne trouvait jamais rien et la réécriture
 *    ne se faisait pas : les deux formes doivent être reconnues.
 */
export function fixTwitchParents(html: string, host?: string): string {
  if (!html || !host) return html;

  const parent = host.replace(/:\d+$/, '');
  if (!HOSTNAME.test(parent)) return html;

  return html.replace(/src="(https:\/\/(?:player|clips)\.twitch\.tv\/[^"]*)"/g, (match, url) => {
    // `&amp;` avant `&` : l'alternative la plus longue doit gagner.
    const rewritten = String(url).replace(/(\?|&amp;|&)parent=[^&"]*/g, '$1parent=' + parent);
    return 'src="' + rewritten + '"';
  });
}

/**
 * Vignette d'aperçu d'une intégration, quand la plateforme en expose une
 * sans appel d'API. YouTube sert ses miniatures en URL directe ; Twitch,
 * Vimeo et Dailymotion exigent une requête authentifiée, on renvoie donc
 * null et l'appelant affiche une carte de remplacement.
 */
export function embedThumbnail(rawUrl: string): string | null {
  const embed = toEmbedUrl(rawUrl);
  if (!embed || embed.indexOf('/embed/') === -1) return null;
  if (embed.indexOf('youtube-nocookie.com') === -1) return null;

  const id = embed.split('/embed/')[1].split(/[?&#]/)[0];
  return id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : null;
}

/**
 * Vérifie que les premiers octets du fichier correspondent bien au type
 * annoncé. Le type MIME transmis à l'upload est déclaré par le client :
 * n'importe quel fichier renommé le franchit. Ce contrôle lit la signature
 * réelle du contenu.
 *
 * Retourne true si la signature correspond, false sinon.
 */
export function matchesDeclaredType(bytes: Uint8Array, mime: string): boolean {
  const at = (offset: number, signature: number[]) =>
    signature.every((b, i) => bytes[offset + i] === b);

  const ascii = (offset: number, text: string) =>
    at(offset, Array.from(text).map((ch) => ch.charCodeAt(0)));

  switch (mime) {
    case 'image/jpeg':
      return at(0, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/gif':
      return ascii(0, 'GIF87a') || ascii(0, 'GIF89a');
    case 'image/webp':
      return ascii(0, 'RIFF') && ascii(8, 'WEBP');
    case 'image/avif':
      return ascii(4, 'ftyp');
    case 'video/mp4':
    case 'video/quicktime':
      // Conteneur ISO-BMFF : « ftyp » suit la taille de la première boîte
      return ascii(4, 'ftyp');
    case 'video/webm':
      return at(0, [0x1a, 0x45, 0xdf, 0xa3]); // en-tête Matroska
    case 'video/ogg':
      return ascii(0, 'OggS');
    default:
      return false;
  }
}
