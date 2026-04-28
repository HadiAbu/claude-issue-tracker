const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export type Project = {
  id: number
  key: string
  name: string
  description: string
  created_at: string
}

export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export type Issue = {
  id: number
  project_id: number
  title: string
  description: string
  status: Status
  priority: Priority
  assignee: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

export type ProjectStats = {
  by_status: { status: Status; count: number }[]
  by_priority: { priority: Priority; count: number }[]
  by_assignee: { assignee: string; count: number }[]
  timeseries: { date: string; created: number; closed: number }[]
}

export const api = {
  projects: () => http<Project[]>('/projects'),
  project: (id: number) => http<Project>(`/projects/${id}`),
  createProject: (data: { key: string; name: string; description?: string }) =>
    http<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  issues: (projectId: number) => http<Issue[]>(`/projects/${projectId}/issues`),
  createIssue: (projectId: number, data: Partial<Issue> & { title: string }) =>
    http<Issue>(`/projects/${projectId}/issues`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIssue: (id: number, data: Partial<Issue>) =>
    http<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  stats: (projectId: number) => http<ProjectStats>(`/projects/${projectId}/stats`),
}
