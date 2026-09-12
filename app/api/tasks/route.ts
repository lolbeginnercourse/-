import { start } from 'workflow/api';
import { z } from 'zod';
import { isOfficeAuthenticated, isSameOrigin } from '@/lib/auth';
import { attachRunId, createTaskRecord, listTaskRecords, markTaskFailed } from '@/lib/db';
import { employeeIds } from '@/lib/employees';
import { employeeTaskWorkflow } from '@/workflows/employee-task';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  taskId: z.string().min(8).max(120),
  employeeId: z.enum(employeeIds),
  task: z.string().trim().min(3).max(24000)
});

export async function GET() {
  if (!(await isOfficeAuthenticated())) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!process.env.DATABASE_URL) return Response.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  try {
    const tasks = await listTaskRecords();
    return Response.json({ tasks }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Task database is unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isOfficeAuthenticated())) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!process.env.DATABASE_URL) return Response.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json({ error: 'AI Gateway authentication is not configured on this environment.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid task request.', details: parsed.error.flatten() }, { status: 400 });

  try {
    await createTaskRecord(parsed.data);
    const run = await start(employeeTaskWorkflow, [parsed.data]);
    await attachRunId(parsed.data.taskId, run.runId);
    return Response.json({ taskId: parsed.data.taskId, runId: run.runId, status: 'queued' }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Failed to start workflow.';
    await markTaskFailed(parsed.data.taskId, message).catch(() => undefined);
    return Response.json({ error: 'タスクを開始できませんでした。' }, { status: 500 });
  }
}
