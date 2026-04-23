import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import Topbar from '../components/Topbar'

const JOURS = ['LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI','DIMANCHE']

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

const COLORS_PALETTE = ['#5865F2','#1D9E75','#EF9F27','#E24B4A','#AFA9EC','#5DCAA5','#C084FC','#F97316','#06B6D4','#EC4899','#7c7c9a']

export default function Planning({ user }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [events, setEvents] = useState([])
  const [poles, setPoles] = useState([])
  const [types, setTypes] = useState([])
  const [filterType, setFilterType] = useState('')
  const [filterPole, setFilterPole] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [typesModal, setTypesModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [form, setForm] = useState({ titre: '', type: '', pole: '', date: '', heure: '18:00', responsable: '', description: '' })
  const [newType, setNewType] = useState({ nom: '', couleur: '#5865F2' })
  const [editType, setEditType] = useState(null)
  const [toast, setToast] = useState(null)
  const [polesModal, setPolesModal] = useState(false)
const [newPole, setNewPole] = useState('')

  useEffect(() => {
    loadPoles()
    loadTypes()
  }, [])

  useEffect(() => {
    loadWeek()
    const interval = setInterval(loadWeek, 30000)
    return () => clearInterval(interval)
  }, [weekStart])

  async function loadPoles() {
  try { const data = await api.get('/planning/poles'); setPoles(data) } catch {}
}

  async function loadTypes() {
    try { const data = await api.get('/planning/types'); setTypes(data) } catch {}
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

  function getTypeColor(nom) {
    const t = types.find(t => t.nom === nom)
    return t?.couleur || '#7c7c9a'
  }

  function openAddModal(dateStr = null) {
    setEditId(null)
    setForm({ titre: '', type: types[0]?.nom || '', pole: '', date: dateStr || formatDateISO(new Date()), heure: '18:00', responsable: user?.username || '', description: '' })
    setModal(true)
  }

  function openEditModal(ev) {
    setEditId(ev.id)
    setForm({ titre: ev.titre, type: ev.type || '', pole: ev.pole || '', date: ev.date, heure: ev.heure?.substring(0,5) || '18:00', responsable: ev.responsable || '', description: ev.description || '' })
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

  async function addType() {
    if (!newType.nom.trim()) return
    try {
      await api.post('/planning/types', newType)
      setNewType({ nom: '', couleur: '#5865F2' })
      loadTypes()
      showToast('Type ajouté')
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }
  async function addPole() {
  if (!newPole.trim()) return
  try {
    await api.post('/planning/poles', { nom: newPole.trim() })
    setNewPole('')
    loadPoles()
    showToast('Pôle ajouté')
  } catch (err) { showToast('Erreur', '#E24B4A') }
}

async function deletePole(id, nom) {
  if (!confirm(`Supprimer le pôle "${nom}" ?`)) return
  try {
    await api.delete(`/planning/poles/${id}`)
    loadPoles()
    showToast('Pôle supprimé', '#E24B4A')
  } catch { showToast('Erreur', '#E24B4A') }
}

  async function saveEditType() {
    try {
      await api.put(`/planning/types/${editType.id}`, { nom: editType.nom, couleur: editType.couleur })
      setEditType(null)
      loadTypes()
      showToast('Type modifié')
    } catch { showToast('Erreur', '#E24B4A') }
  }

  async function deleteType(id, nom) {
    if (!confirm(`Supprimer le type "${nom}" ?`)) return
    try {
      await api.delete(`/planning/types/${id}`)
      loadTypes()
      showToast('Type supprimé', '#E24B4A')
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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
              {types.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}
            </select>
            <select value={filterPole} onChange={e => setFilterPole(e.target.value)} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '9px', padding: '8px 14px', color: '#e2e0f0', fontSize: '12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              <option value="">Tous les pôles</option>
              {poles.map(p => <option key={p.id} value={p.nom}>{p.nom}</option>)}
            </select>
            <button onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()-7); return d })} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e2e0f0' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={() => setWeekStart(getMonday(new Date()))} style={{ background: '#5865F2', border: 'none', borderRadius: '9px', padding: '8px 18px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Aujourd'hui
            </button>
            <button onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate()+7); return d })} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e2e0f0' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            {(user?.role === 'Admin' || user?.role === 'User' || user?.role === 'Joueur') && (
              <button onClick={() => setTypesModal(true)} style={{ background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '9px', padding: '8px 18px', color: '#e2e0f0', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Gérer les types
              </button>
            )}
            {(user?.role === 'Admin' || user?.role === 'User') && (
  <button onClick={() => setPolesModal(true)} style={{ background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '9px', padding: '8px 18px', color: '#e2e0f0', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
    Gérer les pôles
  </button>
)}
            {canEdit && (
              <button onClick={() => openAddModal()} style={{ background: '#EF9F27', border: 'none', borderRadius: '9px', padding: '8px 18px', color: '#0f1117', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                  <div style={{ fontSize: '9px', fontWeight: 700, color: isToday ? '#5865F2' : '#7c7c9a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{JOURS[i]}</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: isToday ? '#5865F2' : '#e2e0f0' }}>{day.getDate()}</div>
                </div>
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayEvents.length === 0 && !loading && (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: '#4a4a6a', fontSize: '11px' }}>Aucun événement</div>
                  )}
                  {dayEvents.map(ev => {
                    const c = getTypeColor(ev.type)
                    return (
                      <div key={ev.id} onClick={() => openDetail(ev)} style={{ background: '#1e2035', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', borderLeft: `3px solid ${c}`, transition: 'all 0.15s' }}
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
                          {ev.type && <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '1px 6px', borderRadius: '10px', fontWeight: 600, background: `${c}22`, color: c, border: `0.5px solid ${c}40` }}>{ev.type}</span>}
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
                  <option value="">— Aucun —</option>
                  {types.map(t => (
                    <option key={t.id} value={t.nom}>{t.nom}</option>
                  ))}
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
              <button className="btn-submit" style={{ background: '#EF9F27', color: '#0f1117' }} onClick={save}>{editId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detailModal && detailEvent && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '400px', borderTopColor: getTypeColor(detailEvent.type) }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: getTypeColor(detailEvent.type), color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', marginBottom: '12px' }}>
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

      {/* Modal gestion types */}
      {typesModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setTypesModal(false)}>
          <div className="modal">
            <h2>Gérer les types</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
              {types.map(t => (
                <div key={t.id}>
                  {editType?.id === t.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#0f1117', borderRadius: '9px', padding: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: editType.couleur, flexShrink: 0 }} />
                      <input value={editType.nom} onChange={e => setEditType({ ...editType, nom: e.target.value })} style={{ flex: 1, background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '7px', padding: '6px 10px', color: '#e2e0f0', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '140px' }}>
                        {COLORS_PALETTE.map(c => (
                          <div key={c} onClick={() => setEditType({ ...editType, couleur: c })} style={{ width: '18px', height: '18px', borderRadius: '4px', background: c, cursor: 'pointer', border: editType.couleur === c ? '2px solid #fff' : '2px solid transparent' }} />
                        ))}
                      </div>
                      <button onClick={saveEditType} style={{ background: '#5865F2', border: 'none', borderRadius: '7px', color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>✓</button>
                      <button onClick={() => setEditType(null)} style={{ background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '7px', color: '#7c7c9a', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>✗</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f1117', borderRadius: '9px', padding: '8px 12px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.couleur, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', color: t.couleur, fontWeight: 500 }}>{t.nom}</span>
                      <button onClick={() => setEditType({ ...t })} style={{ background: 'none', border: '0.5px solid #2e2e4a', borderRadius: '6px', color: '#7c7c9a', cursor: 'pointer', padding: '3px 8px', fontSize: '11px' }}>✏️</button>
                      <button onClick={() => deleteType(t.id, t.nom)} style={{ background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ borderTop: '0.5px solid #2e2e4a', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#7c7c9a', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ajouter un type</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={newType.nom} onChange={e => setNewType({ ...newType, nom: e.target.value })} onKeyDown={e => e.key === 'Enter' && addType()} placeholder="Nom du type..." style={{ flex: 1, minWidth: '120px', background: '#0f1117', border: '0.5px solid #2e2e4a', borderRadius: '9px', padding: '9px 12px', color: '#e2e0f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {COLORS_PALETTE.map(c => (
                    <div key={c} onClick={() => setNewType({ ...newType, couleur: c })} style={{ width: '22px', height: '22px', borderRadius: '6px', background: c, cursor: 'pointer', border: newType.couleur === c ? '2px solid #fff' : '2px solid transparent', transform: newType.couleur === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
                  ))}
                </div>
                <button className="btn-submit" onClick={addType}>Ajouter</button>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setTypesModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
{polesModal && (
  <div className="overlay" onClick={e => e.target === e.currentTarget && setPolesModal(false)}>
    <div className="modal">
      <h2>Gérer les pôles du planning</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', minHeight: '40px' }}>
        {poles.length === 0 && <span style={{ color: '#7c7c9a', fontSize: '13px' }}>Aucun pôle</span>}
        {poles.map((p, i) => {
          const colors = ['#5865F2','#1D9E75','#EF9F27','#E24B4A','#AFA9EC','#5DCAA5']
          const c = colors[i % colors.length]
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${c}22`, border: `0.5px solid ${c}40`, borderRadius: '8px', padding: '5px 10px' }}>
              <span style={{ fontSize: '12px', color: c, fontWeight: 500 }}>{p.nom}</span>
              <button onClick={() => deletePole(p.id, p.nom)} style={{ background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>×</button>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={newPole} onChange={e => setNewPole(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPole()} placeholder="Nom du pôle..." style={{ flex: 1, background: '#0f1117', border: '0.5px solid #2e2e4a', borderRadius: '9px', padding: '9px 12px', color: '#e2e0f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
        <button className="btn-submit" onClick={addPole}>Ajouter</button>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={() => setPolesModal(false)}>Fermer</button>
      </div>
    </div>
  </div>
)}
      {toast && <div className="toast" style={{ background: toast.color }}>✓ {toast.msg}</div>}
    </div>
  )
}