import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import Topbar from '../components/Topbar'

const JOURS = ['LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI','DIMANCHE']
const TYPE_COLORS = {
  Support:'#5865F2', Management:'#EF9F27', Ticket:'#1D9E75',
  Légal:'#AFA9EC', Illégal:'#E24B4A', Wipe:'#C084FC',
  Modérateur:'#06B6D4', Remboursement:'#F97316', Audience:'#EC4899',
  Réunion:'#5DCAA5', Autre:'#7c7c9a'
}
const TYPES = Object.keys(TYPE_COLORS)

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

function formatDateISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDateFR(d) {
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
}

export default function Planning({ user }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [events, setEvents] = useState([])
  const [poles, setPoles] = useState([])
  const [filterType, setFilterType] = useState('')
  const [filterPole, setFilterPole] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [form, setForm] = useState({ titre: '', type: 'Support', pole: '', date: '', heure: '18:00', responsable: '', description: '' })
  const [toast, setToast] = useState(null)

  useEffect(() => { loadPoles() }, [])
 useEffect(() => {
  loadWeek()
  const interval = setInterval(loadWeek, 30000)
  return () => clearInterval(interval)
}, [weekStart])

  async function loadPoles() {
    try { const data = await api.get('/poles'); setPoles(data) } catch {}
  }

  async function loadWeek() {
    setLoading(true)
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    try {
      const data = await api.get(`/planning?start=${formatDateISO(weekStart)}&end=${formatDateISO(end)}`)
      setEvents(data)
    } catch { showToast('Erreur chargement', '#E24B4A') }
    finally { setLoading(false) }
  }

  function showToast(msg, color = '#1D9E75') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  async function addLog(action) {
    try { await api.post('/logs', { type: 'membre', action, username: user?.username }) } catch {}
  }

  function openAddModal(dateStr = null) {
    setEditId(null)
    setForm({ titre: '', type: 'Support', pole: '', date: dateStr || formatDateISO(new Date()), heure: '18:00', responsable: user?.username || '', description: '' })
    setModal(true)
  }

  function openEditModal(ev) {
    setEditId(ev.id)
    setForm({ titre: ev.titre, type: ev.type || 'Support', pole: ev.pole || '', date: ev.date, heure: ev.heure?.substring(0,5) || '18:00', responsable: ev.responsable || '', description: ev.description || '' })
    setDetailModal(false)
    setModal(true)
  }

  function openDetail(ev) {
    setDetailEvent(ev)
    setDetailModal(true)
  }

  async function save() {
    if (!form.titre || !form.date || !form.heure) return alert('Remplir titre, date et heure')
    try {
      if (editId) {
        await api.put(`/planning/${editId}`, { ...form, created_by: user?.username })
        await addLog(`Événement modifié : ${form.titre}`)
        showToast('Événement modifié')
      } else {
        await api.post('/planning', { ...form, created_by: user?.username })
        await addLog(`Événement créé : ${form.titre}`)
        showToast('Événement ajouté')
      }
      setModal(false)
      loadWeek()
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }

  async function deleteEvent(id, titre) {
    if (!confirm('Supprimer ?')) return
    try {
      await api.delete(`/planning/${id}`)
      await addLog(`Événement supprimé : ${titre}`)
      showToast('Supprimé', '#E24B4A')
      setDetailModal(false)
      setModal(false)
      loadWeek()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const today = formatDateISO(new Date())
  const canEdit = user?.role === 'Admin' || user?.role === 'User' || user?.role === 'Joueur'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0f1117' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="bi bi-calendar3" style={{ fontSize: '28px', color: '#5865F2' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700 }}>Planning Global</div>
              <div style={{ fontSize: '11px', color: '#7c7c9a', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>
                Semaine du {formatDateFR(weekStart)} au {formatDateFR(end)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '9px', padding: '8px 14px', color: '#e2e0f0', fontSize: '12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              <option value="">Tous les types</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filterPole} onChange={e => setFilterPole(e.target.value)} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '9px', padding: '8px 14px', color: '#e2e0f0', fontSize: '12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              <option value="">Tous les pôles</option>
              {poles.map(p => <option key={p.id} value={p.nom}>{p.nom}</option>)}
            </select>
            <button onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()-7); return d })} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e2e0f0' }}>
              <i className="bi bi-chevron-left" style={{ fontSize: '16px' }} />
            </button>
            <button onClick={() => setWeekStart(getMonday(new Date()))} style={{ background: '#5865F2', border: 'none', borderRadius: '9px', padding: '8px 18px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Aujourd'hui
            </button>
            <button onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()+7); return d })} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e2e0f0' }}>
              <i className="bi bi-chevron-right" style={{ fontSize: '16px' }} />
            </button>
            {canEdit && (
              <button onClick={() => openAddModal()} style={{ background: '#EF9F27', border: 'none', borderRadius: '9px', padding: '8px 18px', color: '#0f1117', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px' }}>
                + Ajouter
              </button>
            )}
          </div>
        </div>

        {/* Grille semaine */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: '10px' }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(weekStart)
            day.setDate(day.getDate() + i)
            const dateStr = formatDateISO(day)
            const isToday = dateStr === today
            let dayEvents = events.filter(e => e.date === dateStr)
            if (filterType) dayEvents = dayEvents.filter(e => e.type === filterType)
            if (filterPole) dayEvents = dayEvents.filter(e => e.pole === filterPole)
            dayEvents.sort((a, b) => (a.heure || '').localeCompare(b.heure || ''))

            return (
              <div key={i} style={{ background: '#16182a', border: isToday ? '2px solid #5865F2' : '0.5px solid #2e2e4a', borderRadius: '14px', overflow: 'hidden', minHeight: '200px' }}>
                <div style={{ padding: '14px 14px 10px', textAlign: 'center', borderBottom: '0.5px solid #2e2e4a' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: isToday ? '#5865F2' : '#7c7c9a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {JOURS[i]}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: isToday ? '#5865F2' : '#e2e0f0' }}>
                    {day.getDate()}
                  </div>
                </div>
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayEvents.length === 0 && !loading && (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: '#4a4a6a', fontSize: '11px' }}>Aucun événement</div>
                  )}
                  {dayEvents.map(ev => {
                    const c = TYPE_COLORS[ev.type] || '#7c7c9a'
                    return (
                      <div key={ev.id} onClick={() => openDetail(ev)} style={{ background: '#1e2035', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', borderLeft: `3px solid ${c}`, border: `0.5px solid #2e2e4a`, borderLeftWidth: '3px', borderLeftColor: c, transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#26284a'}
                        onMouseLeave={e => e.currentTarget.style.background = '#1e2035'}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: c, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', marginBottom: '6px' }}>
                          {ev.heure?.substring(0,5)}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#e2e0f0' }}>{ev.titre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7c7c9a' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#AFA9EC', flexShrink: 0 }}>
                            {(ev.responsable || '?')[0]?.toUpperCase()}
                          </div>
                          <span>{ev.responsable || '—'}</span>
                          {ev.type && (
                            <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '1px 6px', borderRadius: '10px', fontWeight: 600, background: `${c}22`, color: c, border: `0.5px solid ${c}40` }}>
                              {ev.type}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {canEdit && (
                  <div onClick={() => openAddModal(dateStr)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', cursor: 'pointer', color: '#4a4a6a', fontSize: '11px', gap: '4px', margin: '0 8px 8px', borderRadius: '8px', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1e2035'; e.currentTarget.style.color = '#7c7c9a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a6a' }}
                  >
                    + Ajouter
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal ajout/edit */}
      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ borderTopColor: '#EF9F27' }}>
            <h2>{editId ? "Modifier l'événement" : 'Nouvel événement'}</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Heure</label>
                <input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Titre</label>
              <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="ex: Audience civile" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Pôle</label>
                <select value={form.pole} onChange={e => setForm({ ...form, pole: e.target.value })}>
                  <option value="">— Aucun —</option>
                  {poles.map(p => <option key={p.id} value={p.nom}>{p.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Responsable</label>
              <input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} placeholder="ex: Astyzia" />
            </div>
            <div className="form-group">
              <label>Description (optionnel)</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Détails de l'événement..." />
            </div>
            <div className="modal-actions">
              {editId && <button className="btn-danger" onClick={() => deleteEvent(editId, form.titre)}>Supprimer</button>}
              <button className="btn-cancel" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-submit" style={{ background: '#EF9F27', color: '#0f1117' }} onClick={save}>
                {editId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detailModal && detailEvent && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '400px', borderTopColor: TYPE_COLORS[detailEvent.type] || '#5865F2' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: TYPE_COLORS[detailEvent.type] || '#5865F2', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', marginBottom: '12px' }}>
              {detailEvent.heure?.substring(0,5)}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{detailEvent.titre}</div>
            {[
              { label: 'Type', value: detailEvent.type },
              { label: 'Pôle', value: detailEvent.pole || '—' },
              { label: 'Responsable', value: detailEvent.responsable || '—' },
              { label: 'Description', value: detailEvent.description || '—' },
              { label: 'Créé par', value: detailEvent.created_by || '—' }
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #1e2035', fontSize: '13px' }}>
                <span style={{ fontSize: '11px', color: '#7c7c9a', width: '90px', flexShrink: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
                <span style={{ color: '#e2e0f0' }}>{row.value}</span>
              </div>
            ))}
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-danger" onClick={() => deleteEvent(detailEvent.id, detailEvent.titre)}>Supprimer</button>
              <button className="btn-cancel" onClick={() => setDetailModal(false)}>Fermer</button>
              <button className="btn-submit" onClick={() => openEditModal(detailEvent)}>Modifier</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" style={{ background: toast.color }}>✓ {toast.msg}</div>}
    </div>
  )
}