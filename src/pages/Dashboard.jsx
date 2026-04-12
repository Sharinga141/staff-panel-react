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

const COLORS_PALETTE = ['#5865F2','#1D9E75','#EF9F27','#E24B4A','#AFA9EC','#5DCAA5','#C084FC','#F97316','#06B6D4','#EC4899']

const DEFAULT_SECTIONS = [
  {id:'events',title:'Prochains événements',color:'#EF9F27',size:'full',order:1,visible:true},
  {id:'users',title:'Derniers utilisateurs',color:'#5865F2',size:'half',order:2,visible:true},
  {id:'logs',title:'Activité récente',color:'#E24B4A',size:'half',order:3,visible:true}
]

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ membres: 0, referents: 0, logs: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const [dashSettings, setDashSettings] = useState({ dashboard_show_membres: 'true', dashboard_show_referents: 'true', dashboard_welcome: 'Panel opérationnel' })
  const [editSection, setEditSection] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [globalModal, setGlobalModal] = useState(false)
  const [welcomeEdit, setWelcomeEdit] = useState('')
  const isAdmin = user?.role === 'Admin' || user?.role === 'Superadmin'

  useEffect(() => {
    load()
    loadSettings()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    try {
      const [membres, referents, roles, logs, events] = await Promise.all([
        api.get('/membres'), api.get('/referents'), api.get('/roles'),
        api.get('/logs'), api.get('/planning/upcoming')
      ])
      const today = new Date().toISOString().split('T')[0]
      setStats({ membres: membres.length, referents: referents.length, logs: logs.filter(l => l.created_at?.startsWith(today)).length })
      setRecentUsers(roles.slice(0, 5))
      setRecentLogs(logs.slice(0, 4))
      setUpcomingEvents(events)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function loadSettings() {
    try {
      const data = await api.get('/settings')
      setDashSettings(prev => ({ ...prev, ...data }))
      setWelcomeEdit(data.dashboard_welcome || 'Panel opérationnel')
      if (data.dashboard_sections) {
        try { setSections(JSON.parse(data.dashboard_sections)) } catch {}
      }
    } catch {}
  }

  async function saveSections(newSections) {
    setSections(newSections)
    await api.put('/settings/dashboard_sections', { value: JSON.stringify(newSections) })
  }

  async function saveSetting(key, value) {
    await api.put(`/settings/${key}`, { value })
    setDashSettings(prev => ({ ...prev, [key]: value }))
  }

  function openEditSection(section) {
    setEditForm({ ...section })
    setEditSection(section.id)
  }

  async function saveEditSection() {
    const newSections = sections.map(s => s.id === editSection ? { ...editForm } : s)
    await saveSections(newSections)
    setEditSection(null)
  }

  async function moveSection(id, dir) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(s => s.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === sorted.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const newOrder = sorted[idx].order
    sorted[idx].order = sorted[swapIdx].order
    sorted[swapIdx].order = newOrder
    await saveSections(sorted)
  }

  async function toggleSection(id) {
    const newSections = sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
    await saveSections(newSections)
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const LOG_COLORS = {
    connexion: { bg: '#5865F215', color: '#5865F2' },
    membre: { bg: '#1D9E7515', color: '#5DCAA5' },
    suppression: { bg: '#E24B4A15', color: '#E24B4A' },
    deconnexion: { bg: '#EF9F2715', color: '#EF9F27' }
  }

  function formatEventDate(d) {
    const today = new Date().toISOString().split('T')[0]
    const tom = new Date(); tom.setDate(tom.getDate() + 1)
    const tomStr = tom.toISOString().split('T')[0]
    if (d === today) return "Aujourd'hui"
    if (d === tomStr) return 'Demain'
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function getSection(id) { return sections.find(s => s.id === id) }

  function renderSection(id) {
    const s = getSection(id)
    if (!s || !s.visible) return null

    const wrapStyle = {
      background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px',
      padding: '18px', position: 'relative',
      gridColumn: s.size === 'full' ? '1 / -1' : 'span 1'
    }

    const headerStyle = {
      fontSize: '10px', fontWeight: 700, color: '#7c7c9a', letterSpacing: '0.1em',
      textTransform: 'uppercase', marginBottom: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }

    const editBtn = isAdmin ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {id === 'events' && <Link to="/planning" style={{ fontSize: '11px', color: '#5865F2', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>}
        <button onClick={() => moveSection(id, 'up')} style={{ background: 'none', border: '0.5px solid #2e2e4a', borderRadius: '6px', color: '#7c7c9a', cursor: 'pointer', padding: '2px 6px', fontSize: '12px' }}>↑</button>
        <button onClick={() => moveSection(id, 'down')} style={{ background: 'none', border: '0.5px solid #2e2e4a', borderRadius: '6px', color: '#7c7c9a', cursor: 'pointer', padding: '2px 6px', fontSize: '12px' }}>↓</button>
        <button onClick={() => openEditSection(s)} style={{ background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '6px', color: '#7c7c9a', cursor: 'pointer', padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Éditer
        </button>
      </div>
    ) : null

    if (id === 'events') return (
      <div key={id} style={wrapStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: s.color }} />
            {s.title}
          </div>
          {editBtn}
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
    )

    if (id === 'users') return (
      <div key={id} style={wrapStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: s.color }} />
            {s.title}
          </div>
          {editBtn}
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
    )

    if (id === 'logs') return (
      <div key={id} style={wrapStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '12px', borderRadius: '2px', background: s.color }} />
            {s.title}
          </div>
          {editBtn}
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
    )

    return null
  }

  const sortedSections = [...sections].sort((a, b) => a.order - b.order)
  const halfSections = sortedSections.filter(s => s.visible && s.size === 'half')
  const fullSections = sortedSections.filter(s => s.visible && s.size === 'full')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0f1117' }}>

        {/* Bannière */}
        <div style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '14px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              <button onClick={() => setGlobalModal(true)} style={{ background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7c7c9a' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Métriques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Membres enregistrés', value: stats.membres, color: '#5865F2', show: dashSettings.dashboard_show_membres !== 'false' },
            { label: 'Référents actifs', value: stats.referents, color: '#1D9E75', show: dashSettings.dashboard_show_referents !== 'false' },
            { label: "Logs aujourd'hui", value: stats.logs, color: '#E24B4A', show: true }
          ].filter(m => m.show).map(m => (
            <div key={m.label} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '12px', padding: '16px 18px', borderTop: `3px solid ${m.color}` }}>
              <div style={{ fontSize: '11px', color: '#7c7c9a', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: m.color }}>{loading ? '—' : m.value}</div>
            </div>
          ))}
        </div>

        {/* Sections dynamiques */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {sortedSections.map(s => renderSection(s.id))}
        </div>

      </div>

      {/* Modal édition section */}
      {editSection && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setEditSection(null)}>
          <div className="modal">
            <h2>Éditer la section</h2>
            <div className="form-group">
              <label>Titre</label>
              <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Couleur de l'accent</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                {COLORS_PALETTE.map(c => (
                  <div key={c} onClick={() => setEditForm({ ...editForm, color: c })} style={{ width: '28px', height: '28px', borderRadius: '7px', background: c, cursor: 'pointer', border: editForm.color === c ? '2px solid #fff' : '2px solid transparent', transform: editForm.color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Taille</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {[{ val: 'full', label: 'Pleine largeur' }, { val: 'half', label: 'Demi largeur' }].map(opt => (
                  <div key={opt.val} onClick={() => setEditForm({ ...editForm, size: opt.val })} style={{ flex: 1, padding: '8px', borderRadius: '9px', cursor: 'pointer', textAlign: 'center', fontSize: '13px', background: editForm.size === opt.val ? '#5865F215' : '#0f1117', border: `0.5px solid ${editForm.size === opt.val ? '#5865F2' : '#2e2e4a'}`, color: editForm.size === opt.val ? '#5865F2' : '#7c7c9a', transition: 'all 0.15s' }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Visibilité</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {[{ val: true, label: '✓ Visible' }, { val: false, label: '✗ Masquée' }].map(opt => (
                  <div key={String(opt.val)} onClick={() => setEditForm({ ...editForm, visible: opt.val })} style={{ flex: 1, padding: '8px', borderRadius: '9px', cursor: 'pointer', textAlign: 'center', fontSize: '13px', background: editForm.visible === opt.val ? '#5865F215' : '#0f1117', border: `0.5px solid ${editForm.visible === opt.val ? '#5865F2' : '#2e2e4a'}`, color: editForm.visible === opt.val ? '#5865F2' : '#7c7c9a', transition: 'all 0.15s' }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditSection(null)}>Annuler</button>
              <button className="btn-submit" onClick={saveEditSection}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal paramètres globaux */}
      {globalModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setGlobalModal(false)}>
          <div className="modal">
            <h2>⚙️ Paramètres du dashboard</h2>
            <div className="form-group">
              <label>Message de bienvenue</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={welcomeEdit} onChange={e => setWelcomeEdit(e.target.value)} placeholder="Panel opérationnel" style={{ flex: 1 }} />
                <button className="btn-submit" onClick={() => saveSetting('dashboard_welcome', welcomeEdit)} style={{ whiteSpace: 'nowrap' }}>Sauver</button>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#7c7c9a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '8px' }}>Cartes statistiques</div>
            {[
              { key: 'dashboard_show_membres', label: 'Carte Membres', color: '#5865F2' },
              { key: 'dashboard_show_referents', label: 'Carte Référents', color: '#1D9E75' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #1e2035' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '13px' }}>{item.label}</span>
                </div>
                <button onClick={() => saveSetting(item.key, dashSettings[item.key] === 'false' ? 'true' : 'false')} style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: dashSettings[item.key] !== 'false' ? '#5865F2' : '#2e2e4a', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', top: '3px', transition: 'left 0.2s', left: dashSettings[item.key] !== 'false' ? '21px' : '3px' }} />
                </button>
              </div>
            ))}
            <div style={{ fontSize: '11px', color: '#7c7c9a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', marginTop: '16px' }}>Sections — cliquez ✏️ sur chaque section pour les éditer</div>
            {sortedSections.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #1e2035' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: '13px' }}>{s.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => moveSection(s.id, 'up')} style={{ background: 'none', border: '0.5px solid #2e2e4a', borderRadius: '6px', color: '#7c7c9a', cursor: 'pointer', padding: '2px 8px' }}>↑</button>
                  <button onClick={() => moveSection(s.id, 'down')} style={{ background: 'none', border: '0.5px solid #2e2e4a', borderRadius: '6px', color: '#7c7c9a', cursor: 'pointer', padding: '2px 8px' }}>↓</button>
                  <button onClick={() => toggleSection(s.id)} style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: s.visible ? '#5865F2' : '#2e2e4a', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', top: '3px', transition: 'left 0.2s', left: s.visible ? '21px' : '3px' }} />
                  </button>
                </div>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn-submit" onClick={() => setGlobalModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}