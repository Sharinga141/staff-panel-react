import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { getPerms } from '../lib/perms'
import Topbar from '../components/Topbar'

export default function Referents({ user }) {
  const [referents, setReferents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', grade: '', service: '', discord: '', uid: '' })
  const [toast, setToast] = useState(null)
  const perms = getPerms(user?.role)

  useEffect(() => {
    if (!perms.seeReferents) return
    load()
  }, [])

  async function load() {
    try {
      const data = await api.get('/referents')
      setReferents(data)
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
    setForm(r
      ? { prenom: r.prenom, nom: r.nom, telephone: r.telephone || '', grade: r.grade || '', service: r.service || '', discord: r.discord || '', uid: r.uid }
      : { prenom: '', nom: '', telephone: '', grade: '', service: '', discord: '', uid: '' }
    )
    setModal(true)
  }

  async function save() {
    if (!form.prenom || !form.nom || !form.uid) return alert('Remplir prénom, nom et ID')
    try {
      if (editId) {
        await api.put(`/referents/${editId}`, form)
        await addLog(`Référent modifié : ${form.prenom} ${form.nom}`)
        showToast('Référent modifié')
      } else {
        await api.post('/referents', form)
        await addLog(`Référent ajouté : ${form.prenom} ${form.nom}`)
        showToast('Référent ajouté')
      }
      setModal(false)
      load()
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }

  async function del(id, name) {
    if (!confirm('Retirer ?')) return
    try {
      await api.delete(`/referents/${id}`)
      await addLog(`Référent supprimé : ${name}`)
      showToast('Retiré', '#E24B4A')
      setModal(false)
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  const GRADE_COLORS = ['#5865F2', '#1D9E75', '#EF9F27', '#E24B4A', '#AFA9EC', '#5DCAA5']

  const filtered = referents.filter(r =>
    `${r.prenom} ${r.nom} ${r.grade} ${r.service}`.toLowerCase().includes(search.toLowerCase())
  )

  if (!perms.seeReferents) return (
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
            <h1>Référents</h1>
            <p>{referents.length} référent(s) enregistré(s)</p>
          </div>
          <button className="add-btn" onClick={() => openModal()}>+ Ajouter un référent</button>
        </div>

        <div className="toolbar">
          <input
            className="search"
            placeholder="Rechercher un référent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '13px', color: '#7c7c9a' }}>{filtered.length} résultat(s)</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Référent</th>
                <th>Téléphone</th>
                <th>Grade</th>
                <th>Service</th>
                <th>Discord</th>
                <th>ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="empty">Chargement...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="empty">Aucun référent</td></tr>}
              {filtered.map((r, i) => {
                const c = GRADE_COLORS[i % GRADE_COLORS.length]
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%', background: '#26215C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 600, color: '#AFA9EC', flexShrink: 0
                        }}>
                          {r.photo
                            ? <img src={r.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : (r.prenom[0] + r.nom[0]).toUpperCase()
                          }
                        </div>
                        <span style={{ fontWeight: 500 }}>{r.prenom} {r.nom}</span>
                      </div>
                    </td>
                    <td style={{ color: '#7c7c9a' }}>{r.telephone || '—'}</td>
                    <td>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
                        background: `${c}22`, color: c, border: `0.5px solid ${c}40`
                      }}>{r.grade || '—'}</span>
                    </td>
                    <td style={{ color: '#7c7c9a' }}>{r.service || '—'}</td>
                    <td style={{ color: '#7c7c9a' }}>{r.discord || '—'}</td>
                    <td><span className="id-badge">{r.uid}</span></td>
                    <td>
                      <button className="action-btn" onClick={() => openModal(r)}>Modifier</button>
                      <button className="action-btn danger" onClick={() => del(r.id, `${r.prenom} ${r.nom}`)}>Retirer</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <h2>{editId ? 'Modifier le référent' : 'Ajouter un référent'}</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Prénom RP</label>
                <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Jean" />
              </div>
              <div className="form-group">
                <label>Nom RP</label>
                <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Dupont" />
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
            <div className="form-group">
              <label>ID unique</label>
              <input value={form.uid} onChange={e => setForm({ ...form, uid: e.target.value })} placeholder="REF-001" />
            </div>
            <div className="modal-actions">
              {editId && <button className="btn-danger" onClick={() => del(editId, `${form.prenom} ${form.nom}`)}>Supprimer</button>}
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