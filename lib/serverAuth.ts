import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}
const SESSION_SECRET = process.env.SESSION_SECRET;

/** Durée de validité d'une session, en millisecondes */
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Jeton de session : `<identifiant>.<expiration>.<signature>`
 *
 * L'expiration fait partie des données signées et est vérifiée au serveur.
 * Auparavant seule la durée du cookie limitait la session : un jeton copié
 * hors du navigateur restait donc valable indéfiniment.
 */
export function createSessionToken(): string {
  // randomBytes plutôt que Math.random : imprévisible par construction
  const id = randomBytes(18).toString('base64url');
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${id}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Vérifie la signature puis la date d'expiration. */
export function verifySessionToken(token: string): boolean {
  if (!token) return false;

  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  if (!safeEqual(signature, sign(payload))) return false;

  // Le format à deux segments est celui des jetons émis avant l'ajout de
  // l'expiration : ils sont refusés, ce qui force une reconnexion.
  const separator = payload.lastIndexOf('.');
  if (separator === -1) return false;

  const expiresAt = Number(payload.slice(separator + 1));
  if (!Number.isFinite(expiresAt)) return false;

  return Date.now() < expiresAt;
}

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

/** Comparaison à durée constante : ne révèle pas où deux chaînes divergent. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Vérifie les identifiants administrateur contre les variables d'environnement */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminPasswordHash) return false;

  const inputHash = createHash('sha256').update(password).digest('hex');
  // Les deux comparaisons sont à durée constante et toutes deux évaluées,
  // pour ne pas révéler par le temps de réponse si l'e-mail existe.
  const emailOk = safeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase());
  const passwordOk = safeEqual(inputHash, adminPasswordHash);
  return emailOk && passwordOk;
}

export const SESSION_COOKIE = 'vexilon_session';
