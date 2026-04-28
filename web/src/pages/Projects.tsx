import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export default function Projects() {
  const qc = useQueryClient()
  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: api.projects })
  const [key, setKey] = useState('')
  const [name, setName] = useState('')

  const create = useMutation({
    mutationFn: () => api.createProject({ key, name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setKey('')
      setName('')
    },
  })

  return (
    <div className="grid" style={{ gap: 24 }}>
      <h2 style={{ margin: 0 }}>Projects</h2>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>New project</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Key (e.g. WEB)"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
          />
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn"
            disabled={!key || !name || create.isPending}
            onClick={() => create.mutate()}
          >
            Create
          </button>
        </div>
        {create.isError && (
          <p style={{ color: '#ff8a99', marginTop: 8 }}>
            {(create.error as Error).message}
          </p>
        )}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Name</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projectsQ.data?.map((p) => (
              <tr key={p.id}>
                <td><span className="badge">{p.key}</span></td>
                <td>{p.name}</td>
                <td>{p.description}</td>
                <td>
                  <Link className="btn" to={`/projects/${p.id}`}>
                    Open board
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
