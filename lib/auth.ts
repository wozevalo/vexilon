// Client-side auth helpers — actual verification happens server-side via API routes.
// No credentials or secrets are stored here.

/** Call POST /api/gestion/login. Returns true if the server accepted the credentials. */
export async function login(email: string, password: string): Promise<boolean> {
  const res = await fetch('/api/gestion/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.ok;
}

/** Call POST /api/gestion/logout to clear the HttpOnly session cookie. */
export async function logout(): Promise<void> {
  await fetch('/api/gestion/logout', { method: 'POST' });
}
