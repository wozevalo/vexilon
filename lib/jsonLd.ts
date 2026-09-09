/**
 * Sérialise un objet JSON-LD pour l'injecter dans une balise <script>.
 *
 * `JSON.stringify` échappe les guillemets, mais ni `<` ni `>`. Une valeur
 * contenant `</script>` refermerait donc la balise et tout ce qui suit
 * serait analysé comme du HTML par le navigateur — le contenu du
 * back-office deviendrait exécutable sur les pages publiques, ce que
 * lib/sanitizeHtml.ts est justement chargé d'empêcher.
 *
 * Les séquences produites ici sont du JSON valide : les moteurs de
 * recherche relisent exactement le même objet.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    // U+2028 / U+2029 : acceptés par JSON.stringify, mais illégaux dans une
    // source JavaScript, ce qui casserait un consommateur qui ferait un eval.
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
