import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Issue, type Priority, type Status } from '../api'
import ConfirmModal, { XIcon } from '../components/ConfirmModal'

const COLUMNS: { key: Status; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
]

const cycle = (s: Status): Status =>
  s === 'todo' ? 'in_progress' : s === 'in_progress' ? 'done' : 'todo'

const NEXT_STATUS_LABEL: Record<Status, string> = {
  todo: 'Move to In Progress',
  in_progress: 'Move to Done',
  done: 'Move to To Do',
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

type EditForm = { title: string; description: string; priority: Priority; assignee: string }

export default function Board() {
  const { projectId } = useParams()
  const id = Number(projectId)
  const qc = useQueryClient()

  const issuesQ = useQuery({
    queryKey: ['issues', id],
    queryFn: () => api.issues(id),
  })

  const [title, setTitle] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [viewing, setViewing] = useState<Issue | null>(null)
  const [editing, setEditing] = useState<Issue | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    title: '', description: '', priority: 'medium', assignee: '',
  })
  const [confirmIssueId, setConfirmIssueId] = useState<number | null>(null)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['issues', id] })
    qc.invalidateQueries({ queryKey: ['stats', id] })
  }

  const create = useMutation({
    mutationFn: () => api.createIssue(id, { title }),
    onSuccess: () => { invalidate(); setTitle('') },
  })

  const update = useMutation({
    mutationFn: ({ issueId, data }: { issueId: number; data: Parameters<typeof api.updateIssue>[1] }) =>
      api.updateIssue(issueId, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (issueId: number) => api.deleteIssue(issueId),
    onSuccess: () => {
      invalidate()
      setConfirmIssueId(null)
      setViewing(null)
    },
  })

  function openEdit(issue: Issue) {
    setEditForm({
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      assignee: issue.assignee ?? '',
    })
    setEditing(issue)
    setViewing(null)
  }

  function saveEdit() {
    if (!editing) return
    update.mutate(
      { issueId: editing.id, data: { ...editForm, assignee: editForm.assignee || null } },
      { onSuccess: () => setEditing(null) },
    )
  }

  const issues = issuesQ.data ?? []
  const archivedCount = issues.filter(i => i.archived).length
  const visible = showArchived ? issues : issues.filter(i => !i.archived)
  const grouped: Record<Status, Issue[]> = { todo: [], in_progress: [], done: [] }
  visible.forEach(i => grouped[i.status].push(i))

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Board</h2>
        {archivedCount > 0 && (
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowArchived(v => !v)}>
            {showArchived ? 'Hide archived' : `Show archived (${archivedCount})`}
          </button>
        )}
      </div>

      <div className="card" style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="New issue title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && title && create.mutate()}
          style={{ flex: 1 }}
        />
        <button
          className="btn"
          disabled={!title || create.isPending}
          onClick={() => create.mutate()}
        >
          Add issue
        </button>
      </div>

      <div className="board">
        {COLUMNS.map((col) => (
          <div className="col card" key={col.key}>
            <h3>{col.label} ({grouped[col.key].length})</h3>
            {grouped[col.key].map((issue) => (
              <div className={`issue${issue.archived ? ' archived' : ''}`} key={issue.id}>
                <div className="issue-header">
                  <div
                    className="title"
                    onClick={() => setViewing(issue)}
                    title="Click to view details"
                  >
                    {issue.title}
                  </div>
                  <div className="issue-actions">
                    <button
                      className="icon-btn"
                      data-tooltip="Edit"
                      onClick={() => openEdit(issue)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      className={`icon-btn${issue.archived ? ' active' : ''}`}
                      data-tooltip={issue.archived ? 'Unarchive' : 'Archive'}
                      onClick={() => update.mutate({ issueId: issue.id, data: { archived: !issue.archived } })}
                    >
                      <ArchiveIcon />
                    </button>
                    <button
                      className="icon-btn danger"
                      data-tooltip="Delete"
                      onClick={() => setConfirmIssueId(issue.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                <div className="meta">
                  <span className={`badge priority-${issue.priority}`}>{issue.priority}</span>{' '}
                  {issue.assignee ?? 'unassigned'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Issue detail modal */}
      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 520 }}>
            <div className="modal-header">
              <h3>{viewing.title}</h3>
              <button className="icon-btn" onClick={() => setViewing(null)}><XIcon /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span className="badge">{viewing.status.replace('_', ' ')}</span>
              <span className={`badge priority-${viewing.priority}`}>{viewing.priority}</span>
            </div>
            {viewing.description && (
              <p style={{ color: '#c8ccd3', margin: '0 0 12px', lineHeight: 1.6 }}>{viewing.description}</p>
            )}
            <p style={{ fontSize: 13, color: '#8a8f9b', margin: '0 0 20px' }}>
              {viewing.assignee ? `Assigned to ${viewing.assignee}` : 'Unassigned'}
              {' · '}
              Created {new Date(viewing.created_at).toLocaleDateString()}
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                style={{ marginRight: 'auto' }}
                onClick={() => setConfirmIssueId(viewing.id)}
              >
                Delete
              </button>
              <button className="btn-ghost" onClick={() => openEdit(viewing)}>Edit</button>
              <button
                className="btn"
                disabled={update.isPending}
                onClick={() => {
                  update.mutate(
                    { issueId: viewing.id, data: { status: cycle(viewing.status) } },
                    { onSuccess: () => setViewing(null) },
                  )
                }}
              >
                {NEXT_STATUS_LABEL[viewing.status]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Issue</h3>
              <button className="icon-btn" onClick={() => setEditing(null)}><XIcon /></button>
            </div>
            <div className="form-row">
              <label>Title</label>
              <input
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-row">
              <label>Priority</label>
              <select
                value={editForm.priority}
                onChange={e => setEditForm({ ...editForm, priority: e.target.value as Priority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-row">
              <label>Assignee</label>
              <input
                value={editForm.assignee}
                onChange={e => setEditForm({ ...editForm, assignee: e.target.value })}
                placeholder="Leave blank to unassign"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button
                className="btn"
                disabled={!editForm.title || update.isPending}
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmIssueId !== null && (
        <ConfirmModal
          title="Delete issue"
          message="Delete this issue? This cannot be undone."
          onConfirm={() => remove.mutate(confirmIssueId)}
          onCancel={() => setConfirmIssueId(null)}
        />
      )}
    </div>
  )
}
