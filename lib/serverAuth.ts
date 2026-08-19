import { createHmac, createHash } from 'crypto';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}
const SESSION_SECRET = process.env.SESSION_SECRET;

/** Generate a signed session token (stored as HttpOnly cookie) */
export function createSessionToken(): string {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const sig = createHmac('sha256', SESSION_SECRET).update(id).digest('hex');
  return `${id}.${sig}`;
}

/** Verify that a session token was signed by this server */
export function verifySessionToken(token: string): boolean {
  if (!token) return false;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return false;
  const id = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expected = createHmac('sha256', SESSION_SECRET).update(id).digest('hex');
  return sig === expected;
}

/** Verify admin credentials against server-side env vars (never exposed to client) */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminPasswordHash) return false;
  const inputHash = createHash('sha256').update(password).digest('hex');
  return email === adminEmail && inputHash === adminPasswordHash;
}

export const SESSION_COOKIE = 'vexilon_session';
