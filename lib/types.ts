export type EmployeeId =
  | 'chief'
  | 'research'
  | 'writer'
  | 'reviewer'
  | 'analyst'
  | 'developer';

export type EmployeeStatus = 'idle' | 'working' | 'done' | 'failed';

export type OfficeEmployee = {
  id: EmployeeId;
  name: string;
  role: string;
  shortRole: string;
  initials: string;
  room: string;
  description: string;
  skills: string[];
  accent: string;
};

export type TaskRequest = {
  taskId: string;
  employeeId: EmployeeId;
  task: string;
};

export type TaskResult = {
  taskId: string;
  employeeId: EmployeeId;
  output: string;
  completedAt: string;
};

export type ClientTask = {
  taskId: string;
  runId: string;
  employeeId: EmployeeId;
  prompt: string;
  status: EmployeeStatus;
  createdAt: string;
  output?: string;
  error?: string;
};
