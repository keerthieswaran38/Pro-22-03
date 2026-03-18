/**
 * Auth utilities — mirrors existing admin auth logic.
 * Credentials: admin@gagner.com / gagner2026
 */

const AUTH_KEY = 'gagner_admin_auth';
const ADMIN_EMAIL = 'admin@gagner.com';
const ADMIN_PASS = 'gagner2026';

export function isLoggedIn(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function login(email: string, password: string): boolean {
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}
