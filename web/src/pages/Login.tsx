import { useState } from 'react'
import { api, setToken } from '../api'

type Props = { onSuccess: () => void }

export default function Login({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.register({ email, password })
      }
      const { access_token } = await api.login(email, password)
      setToken(access_token)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ margin: '0 0 24px', fontSize: 20 }}>Issue Tracker</h1>
        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Sign in
          </button>
          <button
            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-row">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : ''}
              required
            />
          </div>
          {error && (
            <p style={{ color: '#ff8a99', margin: 0, fontSize: 13 }}>{error}</p>
          )}
          <button className="btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {mode === 'login' && (
          <p style={{ marginTop: 16, fontSize: 12, color: '#8a8f9b', textAlign: 'center', margin: '16px 0 0' }}>
            Demo account: demo@example.com / demo1234
          </p>
        )}
      </div>
    </div>
  )
}
