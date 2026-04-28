import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Board from './pages/Board'

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Issue Tracker</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<Board />} />
        </Routes>
      </main>
    </div>
  )
}
