import { cookies } from 'next/headers';
import { isSameOrigin, SESSION_COOKIE, sessionToken, verifyAccessKey } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!process.env.OFFICE_ACCESS_KEY) return Response.json({ error: 'OFFICE_ACCESS_KEY is not configured.' }, { status: 503 });
  const body = await request.json().catch(() => null) as { accessKey?: unknown } | null;
  const accessKey = typeof body?.accessKey === 'string' ? body.accessKey : '';
  if (!verifyAccessKey(accessKey)) return Response.json({ error: 'アクセスキーが違います。' }, { status: 401 });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
