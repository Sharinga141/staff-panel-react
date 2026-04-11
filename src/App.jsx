import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getUser, saveToken } from './lib/api'
import Login from './pages/Login'
import Pending from './pages/Pending'
import Rejected from './pages/Rejected'
import Dashboard from './pages/Dashboard'
import Membres from './pages/Membres'
import Referents from './pages/Referents'
import Registres from './pages/Registres'
import Planning from './pages/Planning'
import Roles from './pages/Roles'
import Logs from './pages/Logs'

function TokenHandler({ setUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (token) {
      saveToken(token)
      window.history.replaceState({}, '', '/')
      setUser(getUser())
      navigate('/', { replace: true })
    }
  }, [])
  return null
}

function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/login" replace />
  if (user.status === 'pending') return <Pending />
  if (user.status === 'rejected') return <Rejected />
  return children
}

export default function App() {
  const [user, setUser] = useState(getUser())

  return (
    <BrowserRouter>
      <TokenHandler setUser={setUser} />
      <Routes>
        <Route path="/login" element={user && user.status === 'approved' ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/membres" element={<ProtectedRoute user={user}><Membres user={user} /></ProtectedRoute>} />
        <Route path="/referents" element={<ProtectedRoute user={user}><Referents user={user} /></ProtectedRoute>} />
        <Route path="/registres" element={<ProtectedRoute user={user}><Registres user={user} /></ProtectedRoute>} />
        <Route path="/planning" element={<ProtectedRoute user={user}><Planning user={user} /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute user={user}><Roles user={user} /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute user={user}><Logs user={user} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}