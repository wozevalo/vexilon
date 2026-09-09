/**
 * Limitation des tentatives de connexion.
 *
 * Compteur en mémoire du processus : il suffit à bloquer une attaque par
 * dictionnaire sur un déploiement à instance unique (VPS, conteneur), qui
 * est la cible visée. Sur un hébergement sans état où chaque requête peut
 * atterrir sur une instance neuve, ce garde-fou perd son effet et devrait
 * être remplacé par un compteur partagé (Redis, base de données).
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // fenêtre d'observation
const LOCKOUT_MS = 15 * 60 * 1000; // durée du blocage une fois le seuil atteint

interface Entry {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

const attempts = new Map<string, Entry>();

/** Empêche la table de grossir indéfiniment sous un flux d'adresses variées */
function prune(now: number) {
  if (attempts.size < 1000) return;
  for (const [key, entry] of attempts) {
    if (now > entry.lockedUntil && now - entry.firstFailureAt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

/** Identifie l'appelant. Derrière un proxy, x-forwarded-for porte l'IP réelle. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'inconnu';
}

/** Secondes restantes avant de pouvoir réessayer, ou 0 si l'accès est libre. */
export function retryAfter(key: string): number {
  const entry = attempts.get(key);
  if (!entry) return 0;
  const remaining = entry.lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  prune(now);

  const entry = attempts.get(key);

  // Première erreur, ou fenêtre d'observation expirée : on repart de zéro
  if (!entry || now - entry.firstFailureAt > WINDOW_MS) {
    attempts.set(key, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
    return;
  }

  entry.failures++;
  if (entry.failures >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    entry.failures = 0;
    entry.firstFailureAt = now;
  }
}

/** Une connexion réussie efface l'historique de l'appelant. */
export function recordSuccess(key: string): void {
  attempts.delete(key);
}
