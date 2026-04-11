import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { getPerms } from '../lib/perms'
import Topbar from '../components/Topbar'

export default function Roles({ user }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const perms = getPerms(user?.role)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.get('/roles')
      setUsers(data)
    } catch { showToast('Erreur chargement', '#E24B4A') }
    finally { setLoading(false) }
  }

  function showToast(msg, color = '#1D9E75') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  async function saveRole(id, role) {
    try {
      await api.put(`/roles/${id}/role`, { role })
      await api.post('/logs', { type: 'membre', action: `Rôle modifié → ${role}`, username: user?.username })
      showToast('Rôle mis à jour')
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  async function deleteUser(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await api.delete(`/roles/${id}`)
      showToast('Supprimé', '#E24B4A')
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  const getRoleBadge = (role) => {
    if (role === 'Admin') return { bg: '#3C1F6B22', color: '#C084FC', border: '#7C3AED55' }
    if (role === 'Joueur') return { bg: '#1D9E7522', color: '#5DCAA5', border: '#1D9E7555' }
    return { bg: '#1e2a3a', color: '#6b8aaa', border: '#2e4a6a55' }
  }

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase())
  )

  if (!perms.seeRoles) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div className="access-denied">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <h2>Accès refusé</h2>
        <p>Vous n'avez pas les permissions pour accéder à cette page.</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#0f1117' }}>

        <div className="page-header">
          <div>
            <h1>Rôles & Statuts</h1>
            <p>Gérez les accès et les comptes</p>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="search"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '13px', color: '#7c7c9a' }}>{filtered.length} utilisateur(s)</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle actuel</th>
                <th>Modifier le rôle</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="empty">Chargement...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={4} className="empty">Aucun utilisateur</td></tr>}
              {filtered.map(u => {
                const badge = getRoleBadge(u.role)
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', background: '#26215C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 600, color: '#AFA9EC', overflow: 'hidden', flexShrink: 0
                        }}>
                          {u.avatar_url
                            ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (u.username || '?')[0].toUpperCase()
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{u.username || 'Inconnu'}</div>
                          <div style={{ fontSize: '11px', color: '#7c7c9a', fontFamily: 'monospace' }}>{u.discord_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '11px', padding: '3px 12px', borderRadius: '20px', fontWeight: 600,
                        background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                      }}>{(u.role || 'User').toUpperCase()}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select
                          defaultValue={u.role || 'User'}
                          onChange={e => saveRole(u.id, e.target.value)}
                          style={{
                            background: '#0f1117', border: '0.5px solid #2e2e4a', borderRadius: '8px',
                            padding: '7px 12px', color: '#e2e0f0', fontSize: '13px',
                            fontFamily: 'inherit', outline: 'none', cursor: 'pointer'
                          }}
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                          <option value="Joueur">Joueur</option>
                        </select>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="action-btn danger"
                        onClick={() => deleteUser(u.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <div className="toast" style={{ background: toast.color }}>✓ {toast.msg}</div>}
    </div>
  )
}