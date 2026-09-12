import { markTaskDone, markTaskFailed, markTaskRunning } from '@/lib/db';
import { runEmployee } from '@/lib/agents';
import type { TaskRequest, TaskResult } from '@/lib/types';

async function executeEmployeeTask(input: TaskRequest): Promise<{ output: string; completedAt: string }> {
  'use step';
  await markTaskRunning(input.taskId);
  console.info(JSON.stringify({ event: 'ai_task_started', taskId: input.taskId, employeeId: input.employeeId }));
  const output = await runEmployee(input.employeeId, input.task);
  return { output, completedAt: new Date().toISOString() };
}

async function persistSuccess(result: TaskResult) {
  'use step';
  await markTaskDone(result);
  console.info(JSON.stringify({ event: 'ai_task_completed', taskId: result.taskId, employeeId: result.employeeId }));
}

async function persistFailure(taskId: string, employeeId: string, message: string) {
  'use step';
  await markTaskFailed(taskId, message);
  console.error(JSON.stringify({ event: 'ai_task_failed', taskId, employeeId, message: message.slice(0, 500) }));
}

export async function employeeTaskWorkflow(input: TaskRequest): Promise<TaskResult> {
  'use workflow';
  try {
    const execution = await executeEmployeeTask(input);
    const result: TaskResult = { taskId: input.taskId, employeeId: input.employeeId, output: execution.output, completedAt: execution.completedAt };
    await persistSuccess(result);
    return result;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'AI workflow failed.';
    await persistFailure(input.taskId, input.employeeId, message);
    throw cause;
  }
}
