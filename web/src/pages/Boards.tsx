import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Boards() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: api.projects })
  const active = projects.filter(p => !p.archived)

  return (
    <div className="grid" style={{ gap: 24 }}>
      <h2 style={{ margin: 0 }}>Boards</h2>

      {isLoading ? (
        <p style={{ color: '#8a8f9b' }}>Loading…</p>
      ) : active.length === 0 ? (
        <p style={{ color: '#8a8f9b' }}>No active projects yet. Create one in Projects.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {active.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card board-card">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <span className="badge" style={{ fontSize: 13, padding: '3px 10px', flexShrink: 0 }}>{p.key}</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</span>
                </div>
                {p.description && (
                  <p style={{ margin: 0, fontSize: 13, color: '#8a8f9b', lineHeight: 1.5 }}>{p.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
