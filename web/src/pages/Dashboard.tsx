import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'

const STATUS_COLORS: Record<string, string> = {
  todo: '#8a8f9b',
  in_progress: '#5b6cff',
  done: '#6affb0',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6affb0',
  medium: '#ffd761',
  high: '#ff8a99',
}

export default function Dashboard() {
  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: api.projects })
  const [projectId, setProjectId] = useState<number | null>(null)

  const activeProjects = (projectsQ.data ?? []).filter(p => !p.archived)

  useEffect(() => {
    if (!projectId && activeProjects.length) {
      setProjectId(activeProjects[0].id)
    } else if (projectId && !activeProjects.find(p => p.id === projectId)) {
      setProjectId(activeProjects[0]?.id ?? null)
    }
  }, [activeProjects, projectId])

  const statsQ = useQuery({
    queryKey: ['stats', projectId],
    queryFn: () => api.stats(projectId!),
    enabled: projectId !== null,
  })

  if (projectsQ.isLoading) return <p>Loading…</p>
  if (!activeProjects.length) return <p>No active projects yet. Create one in the Projects tab.</p>

  return (
    <div className="grid" style={{ gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <select
          value={projectId ?? ''}
          onChange={(e) => setProjectId(Number(e.target.value))}
        >
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} — {p.name}
            </option>
          ))}
        </select>
      </header>

      {statsQ.data && (
        <>
          <div className="grid grid-2">
            <div className="card">
              <h3>Issues by status</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statsQ.data.by_status}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={80}
                    label
                  >
                    {statsQ.data.by_status.map((d, i) => (
                      <Cell key={i} fill={STATUS_COLORS[d.status] ?? '#5b6cff'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3>Issues by priority</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={statsQ.data.by_priority}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="priority" stroke="#8a8f9b" />
                  <YAxis stroke="#8a8f9b" />
                  <Tooltip cursor={{ fill: '#1c2030' }} />
                  <Bar dataKey="count">
                    {statsQ.data.by_priority.map((d, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[d.priority] ?? '#5b6cff'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>Created vs closed (30 days)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={statsQ.data.timeseries}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#8a8f9b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a8f9b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#5b6cff" />
                <Line type="monotone" dataKey="closed" stroke="#6affb0" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>Top assignees</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statsQ.data.by_assignee} layout="vertical">
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#8a8f9b" />
                <YAxis type="category" dataKey="assignee" stroke="#8a8f9b" width={80} />
                <Tooltip cursor={{ fill: '#1c2030' }} />
                <Bar dataKey="count" fill="#5b6cff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
