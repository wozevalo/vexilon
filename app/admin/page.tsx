import { redirect } from 'next/navigation';

/**
 * Ancienne adresse du back-office.
 *
 * Le back-office se trouve sous /gestion : cette page ne fait que rediriger
 * pour que les anciens favoris continuent de fonctionner.
 * - déjà connecté   → /gestion/blog s'affiche directement
 * - non connecté    → le middleware renvoie vers /gestion (page de connexion)
 */
export default function AdminRedirectPage() {
  redirect('/gestion/blog');
}
