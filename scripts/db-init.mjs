import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS office_tasks (
    task_id text PRIMARY KEY,
    run_id text UNIQUE,
    employee_id text NOT NULL,
    prompt text NOT NULL,
    status text NOT NULL DEFAULT 'queued',
    output text,
    error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    CONSTRAINT office_tasks_employee_check CHECK (employee_id IN ('chief','research','writer','reviewer','analyst','developer')),
    CONSTRAINT office_tasks_status_check CHECK (status IN ('queued','running','completed','failed'))
  )
`;
await sql`CREATE INDEX IF NOT EXISTS office_tasks_created_at_idx ON office_tasks (created_at DESC)`;
await sql`CREATE INDEX IF NOT EXISTS office_tasks_status_idx ON office_tasks (status)`;
console.log('office_tasks schema is ready.');
