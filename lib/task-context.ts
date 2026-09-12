import { AsyncLocalStorage } from 'node:async_hooks';

export type TaskExecutionContext = { taskId: string };

const storage = new AsyncLocalStorage<TaskExecutionContext>();

export function withTaskContext<T>(taskId: string, callback: () => T) {
  return storage.run({ taskId }, callback);
}

export function currentTaskId() {
  return storage.getStore()?.taskId;
}
