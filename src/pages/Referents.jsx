import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { getPerms } from '../lib/perms'
import Topbar from '../components/Topbar'

export default function Referents({ user }) {
  const [referents, setReferents] = useState([])
  const [poles, setPoles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ pseudo: '', telephone: '', grade: '', service: '', discord: '', poles: [] })
  const [toast, setToast] = useState(null)
  const perms = getPerms(user?.role)
  const canEdit = perms.seeReferents && user?.role !== 'Joueur'

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    try {
      const [r, p] = await Promise.all([api.get('/referents'), api.get('/poles')])
      setReferents(r.map(ref => ({ ...ref, poles: ref.poles ? JSON.parse(ref.poles) : [] })))
      setPoles(p)
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

  function openModal(r = null) {
    setEditId(r?.id || null)
    setForm(r ? {
      pseudo: r.pseudo || '',
      telephone: r.telephone || '',
      grade: r.grade || '',
      service: r.service || '',
      discord: r.discord || '',
      poles: r.poles || []
    } : { pseudo: '', telephone: '', grade: '', service: '', discord: '', poles: [] })
    setModal(true)
  }

  function togglePole(nom) {
    setForm(f => ({
      ...f,
      poles: f.poles.includes(nom) ? f.poles.filter(p => p !== nom) : [...f.poles, nom]
    }))
  }

  async function save() {
    if (!form.pseudo) return alert('Pseudo requis')
    try {
      if (editId) {
        await api.put(`/referents/${editId}`, form)
        await addLog(`Référent modifié : ${form.pseudo}`)
        showToast('Référent modifié')
      } else {
        await api.post('/referents', form)
        await addLog(`Référent ajouté : ${form.pseudo}`)
        showToast('Référent ajouté')
      }
      setModal(false)
      load()
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }

  async function del(id, pseudo) {
    if (!confirm('Retirer ?')) return
    try {
      await api.delete(`/referents/${id}`)
      await addLog(`Référent supprimé : ${pseudo}`)
      showToast('Retiré', '#E24B4A')
      setModal(false)
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  const POLE_COLORS = ['#5865F2', '#1D9E75', '#EF9F27', '#E24B4A', '#AFA9EC', '#5DCAA5']
  const filtered = referents.filter(r =>
    `${r.pseudo} ${r.grade} ${r.service} ${r.discord}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#0f1117' }}>

        <div className="page-header">
          <div>
            <h1>Référents</h1>
            <p>{referents.length} référent(s) enregistré(s)</p>
          </div>
          {canEdit && (
            <button className="add-btn" onClick={() => openModal()}>+ Ajouter un référent</button>
          )}
        </div>

        {!canEdit && (
          <div style={{ background: '#1D9E7510', border: '0.5px solid #1D9E7540', borderRadius: '10px', padding: '10px 16px', fontSize: '12px', color: '#5DCAA5', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ℹ️ Vous avez un accès en lecture seule sur cette page.
          </div>
        )}

        <div className="toolbar">
          <input className="search" placeholder="Rechercher un référent..." value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: '13px', color: '#7c7c9a' }}>{filtered.length} résultat(s)</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pseudo</th>
                <th>Pôles</th>
                <th>Téléphone</th>
                <th>Grade</th>
                <th>Service</th>
                <th>Discord</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={canEdit ? 7 : 6} className="empty">Chargement...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={canEdit ? 7 : 6} className="empty">Aucun référent</td></tr>}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#AFA9EC', flexShrink: 0 }}>
                        {r.photo ? <img src={r.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (r.pseudo?.[0] || '?').toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{r.pseudo}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(r.poles || []).length === 0 && <span style={{ color: '#7c7c9a' }}>—</span>}
                      {(r.poles || []).map((p, i) => {
                        const poleIdx = poles.findIndex(po => po.nom === p)
                        const c = POLE_COLORS[poleIdx >= 0 ? poleIdx % POLE_COLORS.length : i % POLE_COLORS.length]
                        return <span key={p} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: `${c}22`, color: c, border: `0.5px solid ${c}40` }}>{p}</span>
                      })}
                    </div>
                  </td>
                  <td style={{ color: '#7c7c9a' }}>{r.telephone || '—'}</td>
                  <td style={{ color: '#7c7c9a' }}>{r.grade || '—'}</td>
                  <td style={{ color: '#7c7c9a' }}>{r.service || '—'}</td>
                  <td style={{ color: '#7c7c9a' }}>{r.discord || '—'}</td>
                  {canEdit && (
                    <td>
                      <button className="action-btn" onClick={() => openModal(r)}>Modifier</button>
                      <button className="action-btn danger" onClick={() => del(r.id, r.pseudo)}>Retirer</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <h2>{editId ? 'Modifier le référent' : 'Ajouter un référent'}</h2>
            <div className="form-group">
              <label>Pseudo</label>
              <input value={form.pseudo} onChange={e => setForm({ ...form, pseudo: e.target.value })} placeholder="ex: Astyzia" />
            </div>
            <div className="form-group">
              <label>Pôles <span style={{ color: '#7c7c9a', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(sélection multiple)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {poles.length === 0 && <span style={{ color: '#7c7c9a', fontSize: '12px' }}>Aucun pôle — créez-en dans la page Membres</span>}
                {poles.map((p, i) => {
                  const c = POLE_COLORS[i % POLE_COLORS.length]
                  const selected = form.poles.includes(p.nom)
                  return (
                    <div key={p.id} onClick={() => togglePole(p.nom)} style={{
                      padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      background: selected ? `${c}33` : '#0f1117',
                      color: selected ? c : '#7c7c9a',
                      border: `0.5px solid ${selected ? c : '#2e2e4a'}`,
                      transition: 'all 0.15s'
                    }}>
                      {selected && '✓ '}{p.nom}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Téléphone</label>
                <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="555-123" />
              </div>
              <div className="form-group">
                <label>Grade</label>
                <input value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="Commandant" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Service</label>
                <input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} placeholder="DOJ" />
              </div>
              <div className="form-group">
                <label>Discord</label>
                <input value={form.discord} onChange={e => setForm({ ...form, discord: e.target.value })} placeholder="pseudo#0000" />
              </div>
            </div>
            <div className="modal-actions">
              {editId && <button className="btn-danger" onClick={() => del(editId, form.pseudo)}>Supprimer</button>}
              <button className="btn-cancel" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={save}>{editId ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" style={{ background: toast.color }}>✓ {toast.msg}</div>}
    </div>
  )
}