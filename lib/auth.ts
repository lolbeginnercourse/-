import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'aio_session';
const SESSION_MESSAGE = 'virtual-ai-office-session-v1';

function getAccessKey() { return process.env.OFFICE_ACCESS_KEY || ''; }
function hash(value: string) { return createHash('sha256').update(value).digest(); }

export function verifyAccessKey(candidate: string) {
  const expected = getAccessKey();
  if (!expected || candidate.length === 0) return false;
  return timingSafeEqual(hash(candidate), hash(expected));
}

export function sessionToken() {
  const key = getAccessKey();
  if (!key) return '';
  return createHmac('sha256', key).update(SESSION_MESSAGE).digest('base64url');
}

export async function isOfficeAuthenticated() {
  const expected = sessionToken();
  if (!expected) return false;
  const cookieStore = await cookies();
  const actual = cookieStore.get(SESSION_COOKIE)?.value || '';
  if (!actual) return false;
  return timingSafeEqual(hash(actual), hash(expected));
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return origin === new URL(request.url).origin; } catch { return false; }
}
