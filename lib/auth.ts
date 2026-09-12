import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'aio_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_VERSION = 'v1';

function getAccessKey() { return process.env.OFFICE_ACCESS_KEY || ''; }
function hash(value: string) { return createHash('sha256').update(value).digest(); }
function sign(value: string) { return createHmac('sha256', getAccessKey()).update(value).digest('base64url'); }

export function verifyAccessKey(candidate: string) {
  const expected = getAccessKey();
  if (!expected || candidate.length === 0) return false;
  return timingSafeEqual(hash(candidate), hash(expected));
}

export function createSessionToken() {
  if (!getAccessKey()) return '';
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = randomBytes(18).toString('base64url');
  const payload = `${SESSION_VERSION}.${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string) {
  if (!getAccessKey() || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== SESSION_VERSION) return false;
  const [version, expiresRaw, nonce, signature] = parts;
  if (!/^\d+$/.test(expiresRaw) || !/^[A-Za-z0-9_-]{20,}$/.test(nonce)) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${version}.${expiresRaw}.${nonce}`;
  const expected = sign(payload);
  return timingSafeEqual(hash(signature), hash(expected));
}

export async function isOfficeAuthenticated() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value || '');
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return process.env.NODE_ENV !== 'production';
  try { return origin === new URL(request.url).origin; } catch { return false; }
}
