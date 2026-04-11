import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { getPerms } from '../lib/perms'
import Topbar from '../components/Topbar'

export default function Roles({ user }) {
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const perms = getPerms(user?.role)

  useEffect(() => {
    load()
    loadPending()
    const interval = setInterval(() => { load(); loadPending() }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    try {
      const data = await api.get('/roles')
      setUsers(data)
    } catch { showToast('Erreur chargement', '#E24B4A') }
    finally { setLoading(false) }
  }

  async function loadPending() {
    try {
      const data = await api.get('/roles/pending')
      setPending(data)
    } catch {}
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

  async function approveUser(id) {
    try {
      await api.put(`/roles/${id}/status`, { status: 'approved' })
      await api.post('/logs', { type: 'membre', action: 'Compte approuvé', username: user?.username })
      showToast('Compte approuvé ✓')
      loadPending()
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  async function rejectUser(id) {
    if (!confirm('Refuser cet utilisateur ?')) return
    try {
      await api.put(`/roles/${id}/status`, { status: 'rejected' })
      await api.post('/logs', { type: 'membre', action: 'Compte refusé', username: user?.username })
      showToast('Compte refusé', '#E24B4A')
      loadPending()
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

  const filtered = users.filter(u => (u.username || '').toLowerCase().includes(search.toLowerCase()))

  if (!perms.seeRoles) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div className="access-denied">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
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
          <div><h1>Rôles & Statuts</h1><p>Gérez les accès et les comptes</p></div>
        </div>

        {pending.length > 0 && (
          <div style={{ background: '#EF9F2710', border: '0.5px solid #EF9F2740', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#EF9F27', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF9F27' }} />
              {pending.length} compte(s) en attente de validation
            </div>
            {pending.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '0.5px solid #EF9F2720' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#AFA9EC', overflow: 'hidden', flexShrink: 0 }}>
                  {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.username || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{u.username}</div>
                  <div style={{ fontSize: '11px', color: '#7c7c9a' }}>{u.discord_id}</div>
                </div>
                <button onClick={() => approveUser(u.id)} style={{ background: '#1D9E7522', border: '0.5px solid #1D9E7555', borderRadius: '8px', color: '#5DCAA5', fontSize: '12px', fontWeight: 600, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>✓ Approuver</button>
                <button onClick={() => rejectUser(u.id)} style={{ background: '#A32D2D1a', border: '0.5px solid #A32D2D40', borderRadius: '8px', color: '#E24B4A', fontSize: '12px', fontWeight: 600, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>✗ Refuser</button>
              </div>
            ))}
          </div>
        )}

        <div className="toolbar">
          <input className="search" placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: '13px', color: '#7c7c9a' }}>{filtered.length} utilisateur(s)</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Utilisateur</th><th>Statut compte</th><th>Rôle actuel</th><th>Modifier le rôle</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="empty">Chargement...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="empty">Aucun utilisateur</td></tr>}
              {filtered.map(u => {
                const badge = getRoleBadge(u.role)
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#AFA9EC', overflow: 'hidden', flexShrink: 0 }}>
                          {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{u.username || 'Inconnu'}</div>
                          <div style={{ fontSize: '11px', color: '#7c7c9a', fontFamily: 'monospace' }}>{u.discord_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500, background: u.status === 'approved' ? '#1D9E7515' : u.status === 'pending' ? '#EF9F2715' : '#E24B4A15', color: u.status === 'approved' ? '#1D9E75' : u.status === 'pending' ? '#EF9F27' : '#E24B4A' }}>
                        {u.status === 'approved' ? '✓ Approuvé' : u.status === 'pending' ? '⏳ En attente' : '✗ Refusé'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', padding: '3px 12px', borderRadius: '20px', fontWeight: 600, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {(u.role || 'User').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <select defaultValue={u.role || 'User'} onChange={e => saveRole(u.id, e.target.value)} style={{ background: '#0f1117', border: '0.5px solid #2e2e4a', borderRadius: '8px', padding: '7px 12px', color: '#e2e0f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Joueur">Joueur</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.status === 'pending' && (
                        <>
                          <button onClick={() => approveUser(u.id)} className="action-btn" style={{ color: '#1D9E75' }}>Approuver</button>
                          <button onClick={() => rejectUser(u.id)} className="action-btn danger">Refuser</button>
                        </>
                      )}
                      <button className="action-btn danger" onClick={() => deleteUser(u.id)}>Supprimer</button>
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