import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Issue, type Status } from '../api'

const COLUMNS: { key: Status; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
]

const cycle = (s: Status): Status =>
  s === 'todo' ? 'in_progress' : s === 'in_progress' ? 'done' : 'todo'

export default function Board() {
  const { projectId } = useParams()
  const id = Number(projectId)
  const qc = useQueryClient()
  const issuesQ = useQuery({
    queryKey: ['issues', id],
    queryFn: () => api.issues(id),
  })

  const [title, setTitle] = useState('')

  const create = useMutation({
    mutationFn: () => api.createIssue(id, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues', id] })
      qc.invalidateQueries({ queryKey: ['stats', id] })
      setTitle('')
    },
  })

  const update = useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: Status }) =>
      api.updateIssue(issueId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues', id] })
      qc.invalidateQueries({ queryKey: ['stats', id] })
    },
  })

  const grouped: Record<Status, Issue[]> = { todo: [], in_progress: [], done: [] }
  issuesQ.data?.forEach((i) => grouped[i.status].push(i))

  return (
    <div className="grid" style={{ gap: 24 }}>
      <h2 style={{ margin: 0 }}>Board</h2>

      <div className="card" style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="New issue title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
            <h3>
              {col.label} ({grouped[col.key].length})
            </h3>
            {grouped[col.key].map((issue) => (
              <div
                className="issue"
                key={issue.id}
                onClick={() =>
                  update.mutate({ issueId: issue.id, status: cycle(issue.status) })
                }
                title="Click to advance status"
              >
                <div className="title">{issue.title}</div>
                <div className="meta">
                  <span className={`badge priority-${issue.priority}`}>
                    {issue.priority}
                  </span>{' '}
                  {issue.assignee ?? 'unassigned'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
