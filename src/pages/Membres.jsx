import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { getPerms } from '../lib/perms'
import Topbar from '../components/Topbar'

export default function Membres({ user }) {
  const [membres, setMembres] = useState([])
  const [poles, setPoles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', pole: '', uid: '' })
  const [toast, setToast] = useState(null)
  const perms = getPerms(user?.role)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [m, p] = await Promise.all([api.get('/membres'), api.get('/poles')])
      setMembres(m)
      setPoles(p)
    } catch (err) { showToast('Erreur chargement', '#E24B4A') }
    finally { setLoading(false) }
  }

  function showToast(msg, color = '#1D9E75') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  async function addLog(action) {
    try { await api.post('/logs', { type: 'membre', action, username: user?.username }) } catch {}
  }

  function openModal(m = null) {
    setEditId(m?.id || null)
    setForm(m ? { prenom: m.prenom, nom: m.nom, telephone: m.telephone || '', pole: m.pole || '', uid: m.uid } : { prenom: '', nom: '', telephone: '', pole: '', uid: '' })
    setModal(true)
  }

  async function save() {
    if (!form.prenom || !form.nom || !form.pole || !form.uid) return alert('Remplir tous les champs')
    try {
      if (editId) {
        await api.put(`/membres/${editId}`, form)
        await addLog(`Membre modifié : ${form.prenom} ${form.nom}`)
        showToast('Membre modifié')
      } else {
        await api.post('/membres', form)
        await addLog(`Membre ajouté : ${form.prenom} ${form.nom}`)
        showToast('Membre ajouté')
      }
      setModal(false)
      load()
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }

  async function del(id, name) {
    if (!confirm('Retirer ?')) return
    try {
      await api.delete(`/membres/${id}`)
      await addLog(`Membre supprimé : ${name}`)
      showToast('Retiré', '#E24B4A')
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  const filtered = membres.filter(m =>
    `${m.prenom} ${m.nom} ${m.uid} ${m.pole}`.toLowerCase().includes(search.toLowerCase())
  )

  const POLE_COLORS = ['#5865F2', '#1D9E75', '#EF9F27', '#E24B4A', '#AFA9EC', '#5DCAA5']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#0f1117' }}>

        <div className="page-header">
          <div>
            <h1>Membres</h1>
            <p>{membres.length} membre(s) enregistré(s)</p>
          </div>
          {perms.canEdit && (
            <button className="add-btn" onClick={() => openModal()}>+ Ajouter un membre</button>
          )}
        </div>

        {!perms.canEdit && (
          <div style={{
            background: '#1D9E7510', border: '0.5px solid #1D9E7540', borderRadius: '10px',
            padding: '10px 16px', fontSize: '12px', color: '#5DCAA5', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            ℹ️ Vous avez un accès en lecture seule sur cette page.
          </div>
        )}

        <div className="toolbar">
          <input
            className="search"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '13px', color: '#7c7c9a' }}>{filtered.length} résultat(s)</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Membre</th>
                <th>Téléphone</th>
                <th>Pôle</th>
                <th>ID unique</th>
                {perms.canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={perms.canEdit ? 5 : 4} className="empty">Chargement...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={perms.canEdit ? 5 : 4} className="empty">Aucun membre</td></tr>}
              {filtered.map((m, i) => {
                const c = POLE_COLORS[i % POLE_COLORS.length]
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%', background: '#26215C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 600, color: '#AFA9EC', flexShrink: 0
                        }}>
                          {m.photo
                            ? <img src={m.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : (m.prenom[0] + m.nom[0]).toUpperCase()
                          }
                        </div>
                        <span style={{ fontWeight: 500 }}>{m.prenom} {m.nom}</span>
                      </div>
                    </td>
                    <td style={{ color: '#7c7c9a' }}>{m.telephone || '—'}</td>
                    <td>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
                        background: `${c}22`, color: c, border: `0.5px solid ${c}40`
                      }}>{m.pole || '—'}</span>
                    </td>
                    <td><span className="id-badge">{m.uid}</span></td>
                    {perms.canEdit && (
                      <td>
                        <button className="action-btn" onClick={() => openModal(m)}>Modifier</button>
                        <button className="action-btn danger" onClick={() => del(m.id, `${m.prenom} ${m.nom}`)}>Retirer</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <h2>{editId ? 'Modifier le membre' : 'Ajouter un membre'}</h2>
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
                <label>Pôle</label>
                <select value={form.pole} onChange={e => setForm({ ...form, pole: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {poles.map(p => <option key={p.id} value={p.nom}>{p.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>ID unique</label>
              <input value={form.uid} onChange={e => setForm({ ...form, uid: e.target.value })} placeholder="MBR-001" />
            </div>
            <div className="modal-actions">
              {editId && <button className="btn-danger" onClick={() => del(editId, `${form.prenom} ${form.nom}`).then(() => setModal(false))}>Supprimer</button>}
              <button className="btn-cancel" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={save}>{editId ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ background: toast.color }}>✓ {toast.msg}</div>
      )}
    </div>
  )
}