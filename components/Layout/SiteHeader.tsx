'use client';

import Navbar from './Navbar';

/**
 * En-tête commun à toutes les pages hors accueil.
 *
 * La barre de navigation est en `position: fixed` : le bloc vide qui suit
 * réserve sa hauteur pour que le contenu ne passe pas dessous.
 *
 * L'accueil ne l'utilise pas — il affiche la même barre lui-même, mais
 * seulement une fois le préchargement terminé.
 */
export default function SiteHeader() {
  return (
    <>
      <Navbar />
      <div className="h-20 md:h-24" aria-hidden="true" />
    </>
  );
}
