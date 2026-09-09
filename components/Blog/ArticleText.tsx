import React from 'react';
import { linkifyText } from '@/lib/linkify';

/**
 * Affiche la description d'une actualité en rendant ses liens cliquables.
 *
 * Le HTML injecté ici ne vient jamais de la saisie : `linkifyText` échappe
 * la totalité du texte et ne produit elle-même que des balises `<a>` dont
 * l'adresse commence par http:// ou https://. C'est le seul endroit du
 * projet où le contenu d'un article est inséré en HTML, pour que cette
 * garantie reste vérifiable d'un coup d'œil.
 */
export default function ArticleText({
  content,
  className = '',
}: {
  content?: string;
  className?: string;
}) {
  if (!content) return null;

  return (
    <p
      className={`linked-text ${className}`}
      dangerouslySetInnerHTML={{ __html: linkifyText(content) }}
    />
  );
}
