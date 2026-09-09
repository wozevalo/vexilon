/**
 * Rend cliquables les liens d'un texte brut (descriptions d'actualités).
 *
 * Le contenu des articles est saisi dans un champ libre et stocké en texte
 * simple : il n'y a aucun balisage à conserver. Le texte est parcouru une
 * seule fois ; tout ce qui n'est pas un lien reconnu est échappé, et les
 * seules balises produites sont des `<a>` construits ici à partir d'une URL
 * qui a dû commencer par http:// ou https://. Aucune balise, aucun attribut
 * ni aucun schéma d'URL venu de la saisie ne peut donc atteindre la page.
 *
 * Deux écritures sont reconnues :
 *   — une URL écrite telle quelle : https://exemple.fr
 *   — un lien avec un libellé :     [cliquez ici](https://exemple.fr)
 *
 * L'apparence des liens est définie par `.linked-text a` dans globals.css.
 * La mettre ici en classes Tailwind ne marcherait pas : `lib/` n'est pas
 * balayé par Tailwind, qui supprimerait donc ces classes au build.
 */

/**
 * Un seul passage pour les deux écritures : la forme `[texte](url)` est
 * tentée en premier, l'URL nue ensuite. Chercher les URL nues dans un second
 * temps obligerait à protéger les liens déjà produits.
 */
const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<]+/g;

/** Ponctuation qui suit souvent une URL en fin de phrase, à ne pas avaler */
const TRAILING = /[.,;:!?»)\]]+$/;

/**
 * Retire la ponctuation qui termine la phrase plutôt que l'URL, puis rend
 * les parenthèses fermantes qui en équilibrent une ouvrante : dans
 * « (voir https://exemple.fr) » la parenthèse appartient à la phrase, dans
 * « …/wiki/Valorant_(jeu) » elle appartient à l'adresse.
 */
function trimUrl(raw: string): string {
  let url = raw.replace(TRAILING, '');

  while (url.length < raw.length && raw[url.length] === ')') {
    const opened = url.split('(').length - 1;
    const closed = url.split(')').length - 1;
    if (opened <= closed) break;
    url += ')';
  }

  return url;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function anchor(href: string, label: string): string {
  return (
    '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' +
    escapeHtml(label) +
    '</a>'
  );
}

/** Transforme le texte d'un article en HTML sûr, liens compris. */
export function linkifyText(text: string): string {
  if (!text) return '';

  let html = '';
  let cursor = 0;
  let match: RegExpExecArray | null;

  LINK.lastIndex = 0;
  while ((match = LINK.exec(text)) !== null) {
    const [whole, label, labelledHref] = match;
    html += escapeHtml(text.slice(cursor, match.index));

    if (labelledHref) {
      html += anchor(labelledHref, label);
    } else {
      // URL nue : la ponctuation finale appartient à la phrase, pas au lien.
      const url = trimUrl(whole);
      html += anchor(url, url) + escapeHtml(whole.slice(url.length));
    }

    cursor = match.index + whole.length;
  }

  return html + escapeHtml(text.slice(cursor));
}
