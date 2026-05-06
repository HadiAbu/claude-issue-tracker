import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Boards from './pages/Boards'
import Board from './pages/Board'
import Login from './pages/Login'
import { clearToken, getToken } from './api'

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken())
  const qc = useQueryClient()

  function logout() {
    clearToken()
    qc.clear()
    setAuthed(false)
  }

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Issue Tracker</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/boards">Boards</NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </nav>
        <button className="logout-btn" onClick={logout}>Log out</button>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<Board />} />
        </Routes>
      </main>
    </div>
  )
}
