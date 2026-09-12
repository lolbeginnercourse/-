import { getRun } from 'workflow/api';
import { isOfficeAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ runId: string }> };

export async function GET(_: Request, context: RouteContext) {
  if (!(await isOfficeAuthenticated())) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  const { runId } = await context.params;
  if (!runId || runId.length > 200) return Response.json({ error: 'Invalid run id.' }, { status: 400 });

  try {
    const run = getRun(runId);
    const status = await run.status;
    if (status === 'completed') {
      const result = await run.returnValue;
      return Response.json({ runId, status, result }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json({ runId, status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Workflow run not found.' }, { status: 404 });
  }
}
