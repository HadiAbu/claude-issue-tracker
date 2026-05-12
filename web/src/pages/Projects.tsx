import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Project, type User } from '../api'
import Avatar from '../components/Avatar'
import ConfirmModal, { XIcon } from '../components/ConfirmModal'

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
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
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

  // Members modal state
  const [membersProject, setMembersProject] = useState<Project | null>(null)
  const [addUserId, setAddUserId] = useState<string>('')

  const membersQ = useQuery({
    queryKey: ['members', membersProject?.id],
    queryFn: () => api.projectMembers(membersProject!.id),
    enabled: !!membersProject,
  })
  const allUsersQ = useQuery({
    queryKey: ['users'],
    queryFn: api.users,
    enabled: !!membersProject,
  })

  const members: User[] = membersQ.data ?? []
  const memberIds = new Set(members.map(m => m.id))
  const available = (allUsersQ.data ?? []).filter(u => !memberIds.has(u.id))

  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] })
  const invalidateMembers = (id: number) => qc.invalidateQueries({ queryKey: ['members', id] })

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

  const addMember = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      api.addProjectMember(projectId, userId),
    onSuccess: () => { if (membersProject) { invalidateMembers(membersProject.id) } setAddUserId('') },
  })

  const removeMember = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      api.removeProjectMember(projectId, userId),
    onSuccess: () => { if (membersProject) invalidateMembers(membersProject.id) },
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
          <input placeholder="Key (e.g. WEB)" value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} />
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} />
          <button className="btn" disabled={!key || !name || create.isPending} onClick={() => create.mutate()}>Create</button>
        </div>
        {create.isError && (
          <p style={{ color: '#ff8a99', marginTop: 8 }}>{(create.error as Error).message}</p>
        )}
      </div>

      <div className="card">
        {archivedCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setShowArchived(v => !v)}>
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
                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%' }} />
                  </td>
                  <td>
                    <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ width: '100%' }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn" style={{ padding: '5px 12px', fontSize: 13 }} disabled={!editForm.name || update.isPending} onClick={() => update.mutate({ id: p.id, data: editForm })}>Save</button>
                      <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} style={{ opacity: p.archived ? 0.5 : 1 }}>
                  <td>
                    <span className="badge">{p.key}</span>
                    {p.archived && <span className="badge" style={{ marginLeft: 6, color: '#8a8f9b' }}>archived</span>}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {!p.archived && (
                        <Link className="btn" style={{ fontSize: 13, padding: '5px 12px' }} to={`/projects/${p.id}`}>Open board</Link>
                      )}
                      <button className="icon-btn" data-tooltip="Members" onClick={() => { setMembersProject(p); setAddUserId('') }}>
                        <UsersIcon />
                      </button>
                      <button className="icon-btn" data-tooltip="Edit" onClick={() => startEdit(p)}><EditIcon /></button>
                      <button className={`icon-btn${p.archived ? ' active' : ''}`} data-tooltip={p.archived ? 'Unarchive' : 'Archive'} onClick={() => update.mutate({ id: p.id, data: { archived: !p.archived } })}>
                        <ArchiveIcon />
                      </button>
                      <button className="icon-btn danger" data-tooltip="Delete" onClick={() => setConfirmProject(p)}><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Members modal */}
      {membersProject && (
        <div className="modal-overlay" onClick={() => setMembersProject(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 500 }}>
            <div className="modal-header">
              <h3>Members — {membersProject.name}</h3>
              <button className="icon-btn" onClick={() => setMembersProject(null)}><XIcon /></button>
            </div>

            {/* Add member row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <select value={addUserId} onChange={e => setAddUserId(e.target.value)} style={{ flex: 1 }}>
                <option value="">Add a member…</option>
                {available.map(u => (
                  <option key={u.id} value={u.id}>{u.display_name ?? u.email} ({u.email})</option>
                ))}
              </select>
              <button
                className="btn"
                disabled={!addUserId || addMember.isPending}
                onClick={() => addMember.mutate({ projectId: membersProject.id, userId: Number(addUserId) })}
              >
                Add
              </button>
            </div>

            {/* Member list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} className="member-row">
                  <Avatar user={m} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14 }}>{m.display_name ?? m.email}</div>
                    {m.display_name && <div style={{ fontSize: 12, color: '#8a8f9b' }}>{m.email}</div>}
                  </div>
                  {m.id !== membersProject.owner_id && (
                    <button
                      className="icon-btn danger"
                      data-tooltip="Remove"
                      onClick={() => removeMember.mutate({ projectId: membersProject.id, userId: m.id })}
                    >
                      <MinusIcon />
                    </button>
                  )}
                  {m.id === membersProject.owner_id && (
                    <span className="badge" style={{ fontSize: 11 }}>owner</span>
                  )}
                </div>
              ))}
              {members.length === 0 && membersQ.isSuccess && (
                <p style={{ color: '#8a8f9b', margin: 0, textAlign: 'center' }}>No members yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

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
