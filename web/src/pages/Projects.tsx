import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Project } from '../api'
import ConfirmModal from '../components/ConfirmModal'

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

export default function Projects() {
  const qc = useQueryClient()
  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: api.projects })

  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [confirmProject, setConfirmProject] = useState<Project | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] })

  const create = useMutation({
    mutationFn: () => api.createProject({ key, name }),
    onSuccess: () => { invalidate(); setKey(''); setName('') },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateProject>[1] }) =>
      api.updateProject(id, data),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteProject(id),
    onSuccess: () => { invalidate(); setConfirmProject(null) },
  })

  function startEdit(p: Project) {
    setEditForm({ name: p.name, description: p.description })
    setEditingId(p.id)
  }

  const projects = projectsQ.data ?? []
  const archivedCount = projects.filter(p => p.archived).length
  const visible = showArchived ? projects : projects.filter(p => !p.archived)

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
        {archivedCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setShowArchived(v => !v)}
            >
              {showArchived ? 'Hide archived' : `Show archived (${archivedCount})`}
            </button>
          </div>
        )}
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
            {visible.map((p) =>
              editingId === p.id ? (
                <tr key={p.id}>
                  <td><span className="badge">{p.key}</span></td>
                  <td>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn"
                        style={{ padding: '5px 12px', fontSize: 13 }}
                        disabled={!editForm.name || update.isPending}
                        onClick={() => update.mutate({ id: p.id, data: editForm })}
                      >
                        Save
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: '5px 12px', fontSize: 13 }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} style={{ opacity: p.archived ? 0.5 : 1 }}>
                  <td>
                    <span className="badge">{p.key}</span>
                    {p.archived && (
                      <span className="badge" style={{ marginLeft: 6, color: '#8a8f9b' }}>archived</span>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {!p.archived && (
                        <Link className="btn" style={{ fontSize: 13, padding: '5px 12px' }} to={`/projects/${p.id}`}>
                          Open board
                        </Link>
                      )}
                      <button
                        className="icon-btn"
                        data-tooltip="Edit"
                        onClick={() => startEdit(p)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        className={`icon-btn${p.archived ? ' active' : ''}`}
                        data-tooltip={p.archived ? 'Unarchive' : 'Archive'}
                        onClick={() => update.mutate({ id: p.id, data: { archived: !p.archived } })}
                      >
                        <ArchiveIcon />
                      </button>
                      <button
                        className="icon-btn danger"
                        data-tooltip="Delete"
                        onClick={() => setConfirmProject(p)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {confirmProject && (
        <ConfirmModal
          title="Delete project"
          message={`Delete "${confirmProject.name}"? All its issues will be permanently deleted.`}
          onConfirm={() => remove.mutate(confirmProject.id)}
          onCancel={() => setConfirmProject(null)}
        />
      )}
    </div>
  )
}
