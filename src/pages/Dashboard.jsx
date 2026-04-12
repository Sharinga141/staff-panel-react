import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import Topbar from '../components/Topbar'
import { Link } from 'react-router-dom'

const TYPE_COLORS = {
  Support:'#5865F2', Management:'#EF9F27', Ticket:'#1D9E75',
  Légal:'#AFA9EC', Illégal:'#E24B4A', Wipe:'#C084FC',
  Modérateur:'#06B6D4', Remboursement:'#F97316', Audience:'#EC4899',
  Réunion:'#5DCAA5', Autre:'#7c7c9a'
}

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ membres: 0, referents: 0, logs: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [settingsModal, setSettingsModal] = useState(false)
  const [dashSettings, setDashSettings] = useState({
    dashboard_show_events: 'true',
    dashboard_show_users: 'true',
    dashboard_show_logs: 'true',
    dashboard_show_membres: 'true',
    dashboard_show_referents: 'true',
    dashboard_welcome: 'Panel opérationnel'
  })
  const [welcomeEdit, setWelcomeEdit] = useState('')
  const isAdmin = user?.role === 'Admin' || user?.role === 'Superadmin'

  useEffect(() => {
    load()
    loadDashSettings()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    try {
      const [membres, referents, roles, logs, events] = await Promise.all([
        api.get('/membres'),
        api.get('/referents'),
        api.get('/roles'),
        api.get('/logs'),
        api.get('/planning/upcoming')
      ])
      const today = new Date().toISOString().split('T')[0]
      const todayLogs = logs.filter(l => l.created_at?.startsWith(today))
      setStats({ membres: membres.length, referents: referents.length, logs: todayLogs.length })
      setRecentUsers(roles.slice(0, 5))
      setRecentLogs(logs.slice(0, 4))
      setUpcomingEvents(events)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadDashSettings() {
    try {
      const data = await api.get('/settings')
      setDashSettings(prev => ({ ...prev, ...data }))
      setWelcomeEdit(data.dashboard_welcome || 'Panel opérationnel')
    } catch {}
  }

  async function saveSetting(key, value) {
    try {
      await api.put(`/settings/${key}`, { value })
      setDashSettings(prev => ({ ...prev, [key]: value }))
    } catch {}
  }

  async function saveWelcome() {
    await saveSetting('dashboard_welcome', welcomeEdit)
  }

  function toggle(key) {
    const newVal = dashSettings[key] === 'true' ? 'false' : 'true'
    saveSetting(key, newVal)
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const LOG_COLORS = {
    connexion: { bg: '#5865F215', color: '#5865F2' },
    membre: { bg: '#1D9E7515', color: '#5DCAA5' },
    suppression: { bg: '#E24B4A15', color: '#E24B4A' },
    deconnexion: { bg: '#EF9F2715', color: '#EF9F27' }
  }

  function formatEventDate(dateStr) {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    if (dateStr === today) return "Aujourd'hui"
    if (dateStr === tomorrowStr) return 'Demain'
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0f1117' }}>

        {/* Bannière */}
        <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '14px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#AFA9EC', border: '2px solid #5865F2', overflow: 'hidden', flexShrink: 0 }}>
              {user?.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.username?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '3px' }}>Bonjour, {user?.username} 👋</div>
              <div style={{ fontSize: '12px', color: '#7c7c9a' }}>{dateStr} — {dashSettings.dashboard_welcome || 'Panel opérationnel'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#5865F215', border: '0.5px solid #5865F240', borderRadius: '10px', padding: '8px 16px', fontSize: '11px', color: '#AFA9EC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75' }} />
              Système sécurisé — Connecté
            </div>
            {isAdmin && (
              <button onClick={() => setSettingsModal(true)} style={{ background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7c7c9a' }} title="Personnaliser le dashboard">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Métriques */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[dashSettings.dashboard_show_membres === 'true', dashSettings.dashboard_show_referents === 'true', true].filter(Boolean).length}, minmax(0,1fr))`, gap: '12px', marginBottom: '20px' }}>
          {dashSettings.dashboard_show_membres === 'true' && (
            <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '16px 18px', borderTop: '3px solid #5865F2' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#5865F215', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div style={{ fontSize: '11px', color: '#7c7c9a', marginBottom: '4px' }}>Membres enregistrés</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#5865F2' }}>{loading ? '—' : stats.membres}</div>
            </div>
          )}
          {dashSettings.dashboard_show_referents === 'true' && (
            <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '16px 18px', borderTop: '3px solid #1D9E75' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#1D9E7515', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div style={{ fontSize: '11px', color: '#7c7c9a', marginBottom: '4px' }}>Référents actifs</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#1D9E75' }}>{loading ? '—' : stats.referents}</div>
            </div>
          )}
          <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '16px 18px', borderTop: '3px solid #E24B4A' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#E24B4A15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg>
            </div>
            <div style={{ fontSize: '11px', color: '#7c7c9a', marginBottom: '4px' }}>Logs aujourd'hui</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#E24B4A' }}>{loading ? '—' : stats.logs}</div>
          </div>
        </div>

        {/* Prochains événements */}
        {dashSettings.dashboard_show_events === 'true' && (
          <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '18px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#7c7c9a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: '#EF9F27' }} />
                Prochains événements
              </div>
              <Link to="/planning" style={{ fontSize: '11px', color: '#5865F2', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
            </div>
            {loading && <div className="empty">Chargement...</div>}
            {!loading && upcomingEvents.length === 0 && <div className="empty">Aucun événement à venir</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingEvents.map(ev => {
                const c = TYPE_COLORS[ev.type] || '#7c7c9a'
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: '#1e2035', borderLeft: `3px solid ${c}` }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '70px' }}>
                      <div style={{ fontSize: '10px', color: '#7c7c9a', textTransform: 'uppercase', fontWeight: 600 }}>{formatEventDate(ev.date)}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: c }}>{ev.heure?.substring(0, 5)}</div>
                    </div>
                    <div style={{ width: '0.5px', height: '32px', background: '#2e2e4a' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e0f0' }}>{ev.titre}</div>
                      <div style={{ fontSize: '11px', color: '#7c7c9a', marginTop: '2px' }}>{ev.responsable || '—'}</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 10px', borderRadius: '20px', fontWeight: 600, background: `${c}22`, color: c, border: `0.5px solid ${c}40` }}>{ev.type}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Grille bas */}
        <div style={{ display: 'grid', gridTemplateColumns: `${dashSettings.dashboard_show_users === 'true' && dashSettings.dashboard_show_logs === 'true' ? '1fr 1fr' : '1fr'}`, gap: '14px' }}>
          {dashSettings.dashboard_show_users === 'true' && (
            <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#7c7c9a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: '#5865F2' }} />
                Derniers utilisateurs
              </div>
              {recentUsers.length === 0 && <div className="empty">Aucun utilisateur</div>}
              {recentUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #1e2035' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: '#AFA9EC', overflow: 'hidden', flexShrink: 0 }}>
                    {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{u.username || 'Inconnu'}</div>
                    <div style={{ fontSize: '10px', color: '#7c7c9a' }}>{u.role}</div>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: u.role === 'Admin' ? '#5865F215' : u.role === 'Joueur' ? '#1D9E7515' : '#1e2035', color: u.role === 'Admin' ? '#5865F2' : u.role === 'Joueur' ? '#1D9E75' : '#7c7c9a' }}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
          {dashSettings.dashboard_show_logs === 'true' && (
            <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#7c7c9a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: '#E24B4A' }} />
                Activité récente
              </div>
              {recentLogs.length === 0 && <div className="empty">Aucun log</div>}
              {recentLogs.map(l => {
                const c = LOG_COLORS[l.type] || { bg: '#1e2035', color: '#7c7c9a' }
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '0.5px solid #1e2035' }}>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 500, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{l.type}</span>
                    <span style={{ fontSize: '11px', color: '#7c7c9a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.action}</span>
                    <span style={{ fontSize: '10px', color: '#4a4a6a', fontFamily: 'monospace' }}>{new Date(l.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal personnalisation */}
      {settingsModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setSettingsModal(false)}>
          <div className="modal">
            <h2>⚙️ Personnaliser le dashboard</h2>

            <div className="form-group">
              <label>Message de bienvenue</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={welcomeEdit} onChange={e => setWelcomeEdit(e.target.value)} placeholder="Panel opérationnel" style={{ flex: 1 }} />
                <button className="btn-submit" onClick={saveWelcome} style={{ whiteSpace: 'nowrap' }}>Sauver</button>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#7c7c9a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '8px' }}>
              Sections visibles
            </div>

            {[
              { key: 'dashboard_show_membres', label: 'Carte Membres', color: '#5865F2' },
              { key: 'dashboard_show_referents', label: 'Carte Référents', color: '#1D9E75' },
              { key: 'dashboard_show_events', label: 'Prochains événements', color: '#EF9F27' },
              { key: 'dashboard_show_users', label: 'Derniers utilisateurs', color: '#5865F2' },
              { key: 'dashboard_show_logs', label: 'Activité récente', color: '#E24B4A' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #1e2035' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '13px' }}>{item.label}</span>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                    background: dashSettings[item.key] === 'true' ? '#5865F2' : '#2e2e4a',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    position: 'absolute', width: '16px', height: '16px', background: '#fff',
                    borderRadius: '50%', top: '3px', transition: 'left 0.2s',
                    left: dashSettings[item.key] === 'true' ? '21px' : '3px'
                  }} />
                </button>
              </div>
            ))}

            <div className="modal-actions">
              <button className="btn-submit" onClick={() => setSettingsModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}