import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import Topbar from '../components/Topbar'

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

  useEffect(() => {
    load()
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

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const LOG_COLORS = {
    connexion: { bg: '#5865F215', color: '#5865F2' },
    membre: { bg: '#1D9E7515', color: '#5DCAA5' },
    suppression: { bg: '#E24B4A15', color: '#E24B4A' },
    deconnexion: { bg: '#EF9F2715', color: '#EF9F27' }
  }

  function formatEventDate(dateStr) {
    const d = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    if (dateStr === today.toISOString().split('T')[0]) return "Aujourd'hui"
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Demain'
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0f1117' }}>

        {/* Bannière */}
        <div style={{
          background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '14px',
          padding: '20px 24px', marginBottom: '20px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', background: '#26215C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 700, color: '#AFA9EC', border: '2px solid #5865F2',
              overflow: 'hidden', flexShrink: 0
            }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user?.username?.[0] || '?').toUpperCase()
              }
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '3px' }}>
                Bonjour, {user?.username} 👋
              </div>
              <div style={{ fontSize: '12px', color: '#7c7c9a' }}>{dateStr} — Panel opérationnel</div>
            </div>
          </div>
          <div style={{
            background: '#5865F215', border: '0.5px solid #5865F240', borderRadius: '10px',
            padding: '8px 16px', fontSize: '11px', color: '#AFA9EC',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75' }} />
            Système sécurisé — Connecté
          </div>
        </div>

        {/* Métriques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Membres enregistrés', value: stats.membres, color: '#5865F2', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { label: 'Référents actifs', value: stats.referents, color: '#1D9E75', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            { label: "Logs aujourd'hui", value: stats.logs, color: '#E24B4A', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg> }
          ].map(m => (
            <div key={m.label} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '16px 18px', borderTop: `3px solid ${m.color}` }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                {m.icon}
              </div>
              <div style={{ fontSize: '11px', color: '#7c7c9a', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{loading ? '—' : m.value}</div>
            </div>
          ))}
        </div>

        {/* Prochains événements */}
        <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '18px', marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#7c7c9a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: '#EF9F27' }} />
              Prochains événements
            </div>
            <a href="/planning" style={{ fontSize: '11px', color: '#5865F2', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</a>
          </div>
          {loading && <div className="empty">Chargement...</div>}
          {!loading && upcomingEvents.length === 0 && (
            <div className="empty">Aucun événement à venir</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingEvents.map(ev => {
              const c = TYPE_COLORS[ev.type] || '#7c7c9a'
              return (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '10px',
                  background: '#1e2035', borderLeft: `3px solid ${c}`
                }}>
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '60px' }}>
                    <div style={{ fontSize: '10px', color: '#7c7c9a', textTransform: 'uppercase', fontWeight: 600 }}>
                      {formatEventDate(ev.date)}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: c }}>
                      {ev.heure?.substring(0, 5)}
                    </div>
                  </div>
                  <div style={{ width: '0.5px', height: '32px', background: '#2e2e4a' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e0f0' }}>{ev.titre}</div>
                    <div style={{ fontSize: '11px', color: '#7c7c9a', marginTop: '2px' }}>{ev.responsable || '—'}</div>
                  </div>
                  <span style={{
                    fontSize: '10px', padding: '2px 10px', borderRadius: '20px',
                    fontWeight: 600, background: `${c}22`, color: c, border: `0.5px solid ${c}40`
                  }}>{ev.type}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grille bas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500,
                  background: u.role === 'Admin' ? '#5865F215' : u.role === 'Joueur' ? '#1D9E7515' : '#1e2035',
                  color: u.role === 'Admin' ? '#5865F2' : u.role === 'Joueur' ? '#1D9E75' : '#7c7c9a'
                }}>{u.role}</span>
              </div>
            ))}
          </div>

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
                  <span style={{ fontSize: '10px', color: '#4a4a6a', fontFamily: 'monospace' }}>
                    {new Date(l.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}