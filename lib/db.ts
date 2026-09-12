import { neon } from '@neondatabase/serverless';
import type { ClientTask, EmployeeId, TaskRequest, TaskResult } from '@/lib/types';

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured.');
  return neon(url);
}

function toIso(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeStatus(status: unknown): ClientTask['status'] {
  if (status === 'completed') return 'done';
  if (status === 'failed') return 'failed';
  return 'working';
}

export async function createTaskRecord(input: TaskRequest) {
  const sql = db();
  await sql`INSERT INTO office_tasks (task_id, employee_id, prompt, status) VALUES (${input.taskId}, ${input.employeeId}, ${input.task}, 'queued')`;
}

export async function attachRunId(taskId: string, runId: string) {
  const sql = db();
  await sql`UPDATE office_tasks SET run_id = ${runId}, status = 'running', updated_at = now() WHERE task_id = ${taskId}`;
}

export async function markTaskRunning(taskId: string) {
  const sql = db();
  await sql`UPDATE office_tasks SET status = 'running', updated_at = now() WHERE task_id = ${taskId}`;
}

export async function markTaskDone(result: TaskResult) {
  const sql = db();
  await sql`UPDATE office_tasks SET status = 'completed', output = ${result.output}, error = NULL, completed_at = ${result.completedAt}, updated_at = now() WHERE task_id = ${result.taskId}`;
}

export async function markTaskFailed(taskId: string, message: string) {
  const sql = db();
  await sql`UPDATE office_tasks SET status = 'failed', error = ${message.slice(0, 4000)}, updated_at = now() WHERE task_id = ${taskId}`;
}

export async function listTaskRecords(limit = 40): Promise<ClientTask[]> {
  const sql = db();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const rows = await sql`SELECT task_id, run_id, employee_id, prompt, status, output, error, created_at FROM office_tasks ORDER BY created_at DESC LIMIT ${safeLimit}`;
  return rows.map((row) => ({
    taskId: String(row.task_id),
    runId: row.run_id ? String(row.run_id) : '',
    employeeId: String(row.employee_id) as EmployeeId,
    prompt: String(row.prompt),
    status: normalizeStatus(row.status),
    createdAt: toIso(row.created_at),
    output: row.output ? String(row.output) : undefined,
    error: row.error ? String(row.error) : undefined
  }));
}
