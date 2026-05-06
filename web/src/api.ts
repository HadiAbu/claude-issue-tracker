const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

export const getToken = () => localStorage.getItem('token')
export const setToken = (t: string) => localStorage.setItem('token', t)
export const clearToken = () => localStorage.removeItem('token')

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  if (res.status === 401) {
    clearToken()
    window.location.href = '/'
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export type Project = {
  id: number
  owner_id: number
  key: string
  name: string
  description: string
  created_at: string
  updated_at: string
  archived: boolean
  archived_at: string | null
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
  archived: boolean
  archived_at: string | null
}

export type ProjectStats = {
  by_status: { status: Status; count: number }[]
  by_priority: { priority: Priority; count: number }[]
  by_assignee: { assignee: string; count: number }[]
  timeseries: { date: string; created: number; closed: number }[]
}

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail ?? `${res.status} ${res.statusText}`)
    }
    return res.json() as Promise<{ access_token: string; token_type: string }>
  },
  register: (data: { email: string; password: string }) =>
    http<{ id: number; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  projects: () => http<Project[]>('/projects'),
  project: (id: number) => http<Project>(`/projects/${id}`),
  createProject: (data: { key: string; name: string; description?: string }) =>
    http<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Pick<Project, 'name' | 'description' | 'archived'>>) =>
    http<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: number) => http<void>(`/projects/${id}`, { method: 'DELETE' }),

  issues: (projectId: number) => http<Issue[]>(`/projects/${projectId}/issues`),
  createIssue: (projectId: number, data: Partial<Issue> & { title: string }) =>
    http<Issue>(`/projects/${projectId}/issues`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIssue: (id: number, data: Partial<Issue>) =>
    http<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIssue: (id: number) => http<void>(`/issues/${id}`, { method: 'DELETE' }),

  stats: (projectId: number) => http<ProjectStats>(`/projects/${projectId}/stats`),
}
