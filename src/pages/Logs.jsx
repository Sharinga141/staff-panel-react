import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { getPerms } from '../lib/perms'
import Topbar from '../components/Topbar'

export default function Logs({ user }) {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const perms = getPerms(user?.role)

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    try {
      const data = await api.get('/logs')
      setLogs(data)
    } catch { showToast('Erreur chargement', '#E24B4A') }
    finally { setLoading(false) }
  }

  function showToast(msg, color = '#1D9E75') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  async function clearLogs() {
    if (!confirm('Vider tous les logs ?')) return
    try {
      await api.delete('/logs/clear')
      showToast('Logs vidés', '#E24B4A')
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  const TYPE_COLORS = {
    connexion: { bg: '#5865F215', color: '#5865F2' },
    membre: { bg: '#1D9E7515', color: '#5DCAA5' },
    pole: { bg: '#26215C', color: '#AFA9EC' },
    suppression: { bg: '#A32D2D1a', color: '#E24B4A' },
    deconnexion: { bg: '#EF9F2715', color: '#EF9F27' }
  }

  const filtered = logs.filter(l => {
    const matchSearch = `${l.action} ${l.username}`.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter ? l.type === typeFilter : true
    return matchSearch && matchType
  })

  const stats = {
    total: logs.length,
    connexions: logs.filter(l => l.type === 'connexion').length,
    membres: logs.filter(l => l.type === 'membre').length,
    suppressions: logs.filter(l => l.type === 'suppression').length
  }

  if (!perms.seeLogs) return (
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
          <div><h1>Logs</h1><p>Historique des actions sur le panel</p></div>
          <button className="btn-danger" style={{ padding: '9px 18px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }} onClick={clearLogs}>Vider les logs</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total logs', value: stats.total, color: '#AFA9EC' },
            { label: 'Connexions', value: stats.connexions, color: '#5865F2' },
            { label: 'Actions membres', value: stats.membres, color: '#5DCAA5' },
            { label: 'Suppressions', value: stats.suppressions, color: '#E24B4A' }
          ].map(s => (
            <div key={s.label} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '16px 18px', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '11px', color: '#7c7c9a', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="toolbar">
          <div style={{ display: 'flex', gap: '10px' }}>
            <input className="search" placeholder="Rechercher dans les logs..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '10px', padding: '9px 14px', color: '#e2e0f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              <option value="">Tous les types</option>
              <option value="connexion">Connexion</option>
              <option value="membre">Membre</option>
              <option value="suppression">Suppression</option>
              <option value="deconnexion">Déconnexion</option>
            </select>
          </div>
          <span style={{ fontSize: '13px', color: '#7c7c9a' }}>{filtered.length} log(s)</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Action</th><th>Utilisateur</th><th>Date & heure</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="empty">Chargement...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={4} className="empty">Aucun log</td></tr>}
              {filtered.map(l => {
                const c = TYPE_COLORS[l.type] || { bg: '#1e2035', color: '#7c7c9a' }
                const d = new Date(l.created_at)
                return (
                  <tr key={l.id}>
                    <td><span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500, background: c.bg, color: c.color }}>{l.type}</span></td>
                    <td>{l.action}</td>
                    <td style={{ color: '#AFA9EC', fontWeight: 500 }}>{l.username}</td>
                    <td style={{ color: '#7c7c9a', fontSize: '12px', fontFamily: 'monospace' }}>{d.toLocaleDateString('fr-FR')} à {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
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