'use client';

import type { CSSProperties, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { employees, employeeMap } from '@/lib/employees';
import type { ClientTask, EmployeeId, EmployeeStatus, TaskResult } from '@/lib/types';

const MAX_VISIBLE_TASKS = 40;

function createTaskId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function statusLabel(status: EmployeeStatus) {
  return status === 'working' ? '作業中' : status === 'done' ? '完了' : status === 'failed' ? 'エラー' : '待機中';
}

function workflowStatus(status: string): EmployeeStatus {
  if (status === 'completed') return 'done';
  if (['failed', 'cancelled', 'canceled'].includes(status)) return 'failed';
  return 'working';
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function OfficeApp() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeId>('chief');
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [systemError, setSystemError] = useState('');
  const [view, setView] = useState<'office' | 'tasks'>('office');
  const [openTask, setOpenTask] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/tasks', { cache: 'no-store' });
        if (response.status === 401) return window.location.assign('/login');
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'タスク履歴を取得できませんでした。');
        if (!cancelled) setTasks(Array.isArray(body.tasks) ? body.tasks.slice(0, MAX_VISIBLE_TASKS) : []);
      } catch (cause) {
        if (!cancelled) setSystemError(cause instanceof Error ? cause.message : 'タスク履歴を取得できませんでした。');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshTask = useCallback(async (task: ClientTask) => {
    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(task.runId)}`, { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) return window.location.assign('/login');
        if (response.status === 404) return;
        throw new Error(body.error || '状態を取得できませんでした。');
      }
      const nextStatus = workflowStatus(String(body.status));
      const result = body.result as TaskResult | undefined;
      setTasks((current) => current.map((item) => item.taskId === task.taskId ? {
        ...item,
        status: nextStatus,
        output: result?.output ?? item.output,
        error: nextStatus === 'failed' ? (body.error || item.error || 'ワークフローが失敗しました。') : item.error
      } : item));
    } catch (cause) {
      setSystemError(cause instanceof Error ? cause.message : '状態確認に失敗しました。');
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const active = tasks.filter((task) => task.status === 'working' && task.runId);
    if (!active.length) return;
    const timer = window.setInterval(() => active.forEach((task) => void refreshTask(task)), 1800);
    return () => window.clearInterval(timer);
  }, [loaded, refreshTask, tasks]);

  const employeeStatus = useMemo(() => Object.fromEntries(employees.map((employee) => {
    const own = tasks.filter((task) => task.employeeId === employee.id);
    return [employee.id, own.some((task) => task.status === 'working') ? 'working' : own[0]?.status === 'failed' ? 'failed' : 'idle'];
  })) as Record<EmployeeId, EmployeeStatus>, [tasks]);

  const activeCount = tasks.filter((task) => task.status === 'working').length;
  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const selected = employeeMap[selectedEmployee];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const task = prompt.trim();
    if (task.length < 3 || submitting) return;
    const taskId = createTaskId();
    setSubmitting(true);
    setSystemError('');
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, employeeId: selectedEmployee, task })
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) return window.location.assign('/login');
      if (!response.ok) throw new Error(body.error || 'タスクを開始できませんでした。');
      setTasks((current) => [{ taskId, runId: body.runId, employeeId: selectedEmployee, prompt: task, status: 'working', createdAt: new Date().toISOString() }, ...current].slice(0, MAX_VISIBLE_TASKS));
      setPrompt('');
      setOpenTask(taskId);
      setView('tasks');
    } catch (cause) {
      setSystemError(cause instanceof Error ? cause.message : 'タスクを開始できませんでした。');
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.assign('/login');
  }

  return (
    <main className="shell">
      <aside className="rail">
        <div className="brandMark">AO</div>
        <button className={view === 'office' ? 'railButton active' : 'railButton'} onClick={() => setView('office')} aria-label="オフィス">⌂</button>
        <button className={view === 'tasks' ? 'railButton active' : 'railButton'} onClick={() => setView('tasks')} aria-label="タスク">✓{activeCount ? <b>{activeCount}</b> : null}</button>
        <span className="railLive">● LIVE</span>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p>VIRTUAL OPERATIONS</p><h1>AI Office</h1></div>
          <div className="topStats"><span><strong>{activeCount}</strong> 稼働中</span><span><strong>{doneCount}</strong> 完了</span><span><strong>{employees.length}</strong> AI社員</span><button onClick={() => void logout()}>退出</button></div>
        </header>
        {systemError ? <div className="systemAlert">{systemError}</div> : null}

        {view === 'office' ? (
          <div className="officeLayout">
            <section className="officeCanvas">
              <div className="sectionHead"><div><small>FLOOR 01</small><h2>Operations Floor</h2></div><p>席＝役割、点灯＝実行状態。空間を仕事の状態表示として使います。</p></div>
              <div className="floorGrid">
                {employees.map((employee) => {
                  const status = employeeStatus[employee.id];
                  return (
                    <button key={employee.id} className={`roomCard ${selectedEmployee === employee.id ? 'selected' : ''}`} style={{ '--accent': employee.accent } as CSSProperties} onClick={() => setSelectedEmployee(employee.id)}>
                      <span className="roomLabel">{employee.room}</span><span className={`status ${status}`}>● {statusLabel(status)}</span>
                      <div className={`avatar ${status}`}>{employee.initials}</div>
                      <strong>{employee.name}</strong><small>{employee.shortRole}</small>
                    </button>
                  );
                })}
              </div>
            </section>
            <aside className="inspector">
              <div className="person"><div className="largeAvatar" style={{ '--accent': selected.accent } as CSSProperties}>{selected.initials}</div><div><span className={`status ${employeeStatus[selected.id]}`}>● {statusLabel(employeeStatus[selected.id])}</span><h2>{selected.name}</h2><p>{selected.role}</p></div></div>
              <p className="description">{selected.description}</p>
              <div className="skills">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <div className="policy"><strong>◎ 最小権限</strong><p>必要な安全ツールだけを付与。公開・削除・購入などの外部変更権限は持たせていません。</p></div>
            </aside>
          </div>
        ) : (
          <section className="taskBoard">
            <div className="sectionHead"><div><small>DURABLE RUNS</small><h2>タスク実行</h2></div><p>ブラウザを閉じてもサーバー側のWorkflowは継続します。</p></div>
            <div className="taskList">
              {!tasks.length ? <div className="empty"><strong>まだタスクはありません</strong><span>下の入力欄からAI社員へ仕事を渡してください。</span></div> : tasks.map((task) => {
                const employee = employeeMap[task.employeeId];
                const expanded = openTask === task.taskId;
                return <article className="taskCard" key={task.taskId}>
                  <button className="taskSummary" onClick={() => setOpenTask(expanded ? null : task.taskId)}>
                    <span className="miniAvatar" style={{ '--accent': employee.accent } as CSSProperties}>{employee.initials}</span>
                    <span className="taskText"><strong>{task.prompt}</strong><small>{employee.name} · {formatTime(task.createdAt)}</small></span>
                    <span className={`taskState ${task.status}`}>{statusLabel(task.status)}</span>
                  </button>
                  {expanded ? <div className="taskDetail">
                    {task.error ? <p className="error">{task.error}</p> : null}
                    {task.status === 'working' ? <p className="working">◌ {employee.name} が処理中 · {task.runId}</p> : null}
                    {task.output ? <div className="result"><button onClick={() => void navigator.clipboard.writeText(task.output || '')}>コピー</button><pre>{task.output}</pre></div> : null}
                  </div> : null}
                </article>;
              })}
            </div>
          </section>
        )}

        <section className="commandDock">
          <select value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value as EmployeeId)}>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} — {employee.shortRole}</option>)}</select>
          <form onSubmit={submit}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="仕事を具体的に依頼する。例：この市場を最新情報で調査して、反証まで含めて判断材料を作って" maxLength={24000} rows={2}/><button disabled={submitting || prompt.trim().length < 3}>{submitting ? '起動中' : '仕事を渡す'} ↗</button></form>
        </section>
      </section>
    </main>
  );
}
