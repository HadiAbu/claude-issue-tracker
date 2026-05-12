import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type User, type UserCreate, type UserUpdate } from '../api'
import Avatar from '../components/Avatar'
import ConfirmModal, { XIcon } from '../components/ConfirmModal'

const PALETTE = [
  '#5b6cff', '#ff8a99', '#6affb0', '#ffd761', '#ff7043',
  '#c084fc', '#38bdf8', '#fb7185', '#34d399', '#fb923c',
]

function randomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

const EMPTY_CREATE: UserCreate = { email: '', password: '', display_name: '', avatar_color: randomColor() }

export default function Users() {
  const qc = useQueryClient()
  const usersQ = useQuery({ queryKey: ['users'], queryFn: api.users })

  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<UserCreate>({ ...EMPTY_CREATE, avatar_color: randomColor() })

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<UserUpdate & { email: string }>({
    email: '', display_name: '', avatar_color: '#5b6cff', password: '',
  })

  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [err, setErr] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })

  const create = useMutation({
    mutationFn: () => api.createUser(createForm),
    onSuccess: () => {
      invalidate()
      setCreating(false)
      setCreateForm({ ...EMPTY_CREATE, avatar_color: randomColor() })
      setErr('')
    },
    onError: (e: Error) => setErr(e.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => api.updateUser(id, data),
    onSuccess: () => { invalidate(); setEditingUser(null); setErr('') },
    onError: (e: Error) => setErr(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => { invalidate(); setConfirmUser(null) },
  })

  function openEdit(user: User) {
    setEditForm({ email: user.email, display_name: user.display_name ?? '', avatar_color: user.avatar_color, password: '' })
    setEditingUser(user)
    setErr('')
  }

  function saveEdit() {
    if (!editingUser) return
    const data: UserUpdate = {}
    if (editForm.email !== editingUser.email) data.email = editForm.email
    if (editForm.display_name !== (editingUser.display_name ?? '')) data.display_name = editForm.display_name || null
    if (editForm.avatar_color !== editingUser.avatar_color) data.avatar_color = editForm.avatar_color
    if (editForm.password) data.password = editForm.password
    update.mutate({ id: editingUser.id, data })
  }

  const users = usersQ.data ?? []

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Users</h2>
        <button className="btn" onClick={() => { setCreating(true); setErr('') }}>+ New user</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><Avatar user={u} size="md" /></td>
                <td style={{ fontWeight: 500 }}>{u.display_name ?? <span style={{ color: '#8a8f9b' }}>—</span>}</td>
                <td style={{ color: '#8a8f9b', fontSize: 13 }}>{u.email}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="icon-btn" data-tooltip="Edit" onClick={() => openEdit(u)}><EditIcon /></button>
                    <button className="icon-btn danger" data-tooltip="Delete" onClick={() => setConfirmUser(u)}><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ color: '#8a8f9b', textAlign: 'center', padding: 24 }}>No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New user</h3>
              <button className="icon-btn" onClick={() => setCreating(false)}><XIcon /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar user={{ display_name: createForm.display_name || null, email: createForm.email || '?', avatar_color: createForm.avatar_color ?? '#5b6cff' }} size="lg" />
              <div>
                <div style={{ fontSize: 12, color: '#8a8f9b', marginBottom: 6 }}>Avatar color</div>
                <ColorPicker value={createForm.avatar_color ?? '#5b6cff'} onChange={c => setCreateForm({ ...createForm, avatar_color: c })} />
              </div>
            </div>
            <div className="form-row">
              <label>Display name</label>
              <input value={createForm.display_name ?? ''} onChange={e => setCreateForm({ ...createForm, display_name: e.target.value })} placeholder="Full name (optional)" />
            </div>
            <div className="form-row">
              <label>Email *</label>
              <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Password *</label>
              <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 8 characters" />
            </div>
            {err && <p style={{ color: '#ff8a99', fontSize: 13, margin: '0 0 8px' }}>{err}</p>}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn" disabled={!createForm.email || !createForm.password || create.isPending} onClick={() => create.mutate()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit user</h3>
              <button className="icon-btn" onClick={() => setEditingUser(null)}><XIcon /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar user={{ display_name: editForm.display_name || null, email: editForm.email || '?', avatar_color: editForm.avatar_color ?? '#5b6cff' }} size="lg" />
              <div>
                <div style={{ fontSize: 12, color: '#8a8f9b', marginBottom: 6 }}>Avatar color</div>
                <ColorPicker value={editForm.avatar_color ?? '#5b6cff'} onChange={c => setEditForm({ ...editForm, avatar_color: c })} />
              </div>
            </div>
            <div className="form-row">
              <label>Display name</label>
              <input value={editForm.display_name ?? ''} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="form-row">
              <label>New password</label>
              <input type="password" value={editForm.password ?? ''} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
            </div>
            {err && <p style={{ color: '#ff8a99', fontSize: 13, margin: '0 0 8px' }}>{err}</p>}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn" disabled={!editForm.email || update.isPending} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmUser && (
        <ConfirmModal
          title="Delete user"
          message={`Delete "${confirmUser.display_name ?? confirmUser.email}"? This cannot be undone.`}
          onConfirm={() => remove.mutate(confirmUser.id)}
          onCancel={() => setConfirmUser(null)}
        />
      )}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 200 }}>
      {PALETTE.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 24, height: 24, borderRadius: '50%', background: c, border: 'none',
            cursor: 'pointer', outline: c === value ? '2px solid #fff' : '2px solid transparent',
            outlineOffset: 2,
          }}
        />
      ))}
    </div>
  )
}
