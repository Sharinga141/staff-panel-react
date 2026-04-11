import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { getPerms } from '../lib/perms'
import Topbar from '../components/Topbar'

const COLORS = ['#5865F2','#1D9E75','#EF9F27','#E24B4A','#AFA9EC','#5DCAA5','#C084FC','#F97316','#06B6D4','#EC4899']

const TYPE_ICONS = {
  PDF: '📄', Word: '📝', Excel: '📊', Image: '🖼️', Lien: '🔗', Autre: '📁'
}

export default function Registres({ user }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [catModal, setCatModal] = useState(false)
  const [subcatModal, setSubcatModal] = useState(false)
  const [docModal, setDocModal] = useState(false)
  const [editCatId, setEditCatId] = useState(null)
  const [editSubcatId, setEditSubcatId] = useState(null)
  const [editDocId, setEditDocId] = useState(null)
  const [currentCatId, setCurrentCatId] = useState(null)
  const [currentSubcatId, setCurrentSubcatId] = useState(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [subcatForm, setSubcatForm] = useState({ name: '', description: '' })
  const [docForm, setDocForm] = useState({ name: '', type: 'PDF', url: '', description: '' })
  const perms = getPerms(user?.role)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await api.get('/registres')
      setCategories(data.map(c => ({ ...c, open: c.is_open })))
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

  function toggleCat(id) {
    setCategories(cats => cats.map(c => c.id === id ? { ...c, open: !c.open } : c))
    const cat = categories.find(c => c.id === id)
    api.put(`/registres/${id}`, { ...cat, is_open: !cat.open }).catch(() => {})
  }

  function toggleSubcat(catId, subId) {
    setCategories(cats => cats.map(c => c.id === catId
      ? { ...c, subcats: c.subcats.map(s => s.id === subId ? { ...s, open: !s.open } : s) }
      : c
    ))
  }

  function openCatModal(cat = null) {
    if (!perms.canEdit) return
    setEditCatId(cat?.id || null)
    setSelectedColor(cat?.color || COLORS[0])
    setCatForm({ name: cat?.name || '', description: cat?.description || '' })
    setCatModal(true)
  }

  async function saveCat() {
    if (!catForm.name) return alert('Nom requis')
    try {
      if (editCatId) {
        await api.put(`/registres/${editCatId}`, { ...catForm, color: selectedColor, is_open: true })
        await addLog(`Catégorie modifiée : ${catForm.name}`)
        showToast('Catégorie modifiée')
      } else {
        await api.post('/registres', { ...catForm, color: selectedColor })
        await addLog(`Catégorie créée : ${catForm.name}`)
        showToast('Catégorie créée')
      }
      setCatModal(false)
      load()
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }

  async function deleteCat(id, name) {
    if (!confirm('Supprimer ?')) return
    try {
      await api.delete(`/registres/${id}`)
      await addLog(`Catégorie supprimée : ${name}`)
      showToast('Supprimée', '#E24B4A')
      setCatModal(false)
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  function openSubcatModal(catId, sub = null) {
    if (!perms.canEdit) return
    setCurrentCatId(catId)
    setEditSubcatId(sub?.id || null)
    setSubcatForm({ name: sub?.name || '', description: sub?.description || '' })
    setSubcatModal(true)
  }

  async function saveSubcat() {
    if (!subcatForm.name) return alert('Nom requis')
    try {
      if (editSubcatId) {
        await api.put(`/registres/subcats/${editSubcatId}`, subcatForm)
        await addLog(`Sous-catégorie modifiée : ${subcatForm.name}`)
        showToast('Sous-catégorie modifiée')
      } else {
        await api.post('/registres/subcats', { ...subcatForm, registre_id: currentCatId })
        await addLog(`Sous-catégorie créée : ${subcatForm.name}`)
        showToast('Sous-catégorie créée')
      }
      setSubcatModal(false)
      load()
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }

  async function deleteSubcat(id, name) {
    if (!confirm('Supprimer ?')) return
    try {
      await api.delete(`/registres/subcats/${id}`)
      await addLog(`Sous-catégorie supprimée : ${name}`)
      showToast('Supprimée', '#E24B4A')
      setSubcatModal(false)
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  function openDocModal(catId, subcatId = null, doc = null) {
    setCurrentCatId(catId)
    setCurrentSubcatId(subcatId)
    setEditDocId(doc?.id || null)
    setDocForm({ name: doc?.name || '', type: doc?.type || 'PDF', url: doc?.url || '', description: doc?.description || '' })
    setDocModal(true)
  }

  async function saveDoc() {
    if (!docForm.name) return alert('Nom requis')
    try {
      if (editDocId) {
        await api.put(`/registres/docs/${editDocId}`, docForm)
        await addLog(`Document modifié : ${docForm.name}`)
        showToast('Document modifié')
      } else {
        await api.post('/registres/docs', { ...docForm, registre_id: currentCatId, sous_cat_id: currentSubcatId })
        await addLog(`Document ajouté : ${docForm.name}`)
        showToast('Document ajouté')
      }
      setDocModal(false)
      load()
    } catch (err) { showToast('Erreur : ' + (err.error || 'inconnue'), '#E24B4A') }
  }

  async function deleteDoc(id, name) {
    if (!perms.canDelete) return
    if (!confirm('Supprimer ?')) return
    try {
      await api.delete(`/registres/docs/${id}`)
      await addLog(`Document supprimé : ${name}`)
      showToast('Supprimé', '#E24B4A')
      load()
    } catch { showToast('Erreur', '#E24B4A') }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar user={user} userRole={user?.role || 'Joueur'} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#0f1117' }}>

        <div className="page-header">
          <div>
            <h1>Registres</h1>
            <p>Organisez vos documents par catégories</p>
          </div>
          {perms.canEdit && (
            <button className="add-btn" onClick={() => openCatModal()}>+ Nouvelle catégorie</button>
          )}
        </div>

        {loading && <div className="empty">Chargement...</div>}

        {!loading && categories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#7c7c9a', background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '14px' }}>
            Aucune catégorie
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '14px', overflow: 'hidden' }}>

              {/* Header catégorie */}
              <div
                onClick={() => toggleCat(cat.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e2035'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${cat.color}22`, border: `0.5px solid ${cat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: '12px', color: '#7c7c9a', marginTop: '2px' }}>
                      {cat.subcats?.length || 0} sous-cat · {(cat.rootDocs?.length || 0) + (cat.subcats?.reduce((a, s) => a + (s.docs?.length || 0), 0) || 0)} docs
                      {cat.description ? ` · ${cat.description}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                  {perms.canEdit && (
                    <>
                      <button className="action-btn" onClick={() => openCatModal(cat)}>Modifier</button>
                      <button className="action-btn danger" onClick={() => deleteCat(cat.id, cat.name)}>Supprimer</button>
                    </>
                  )}
                  <svg style={{ transform: cat.open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#7c7c9a' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {cat.open && (
                <div style={{ borderTop: '0.5px solid #2e2e4a' }}>
                  {/* Toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid #1e2035', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#7c7c9a' }}>
                      {(cat.rootDocs?.length || 0) + (cat.subcats?.reduce((a, s) => a + (s.docs?.length || 0), 0) || 0)} document(s)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {perms.canEdit && (
                        <button onClick={() => openSubcatModal(cat.id)} style={{ background: '#1D9E751a', border: '0.5px solid #1D9E7540', borderRadius: '8px', color: '#5DCAA5', fontSize: '12px', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          + Sous-catégorie
                        </button>
                      )}
                      <button onClick={() => openDocModal(cat.id)} style={{ background: '#1e2035', border: '0.5px solid #2e2e4a', borderRadius: '8px', color: '#e2e0f0', fontSize: '12px', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        + Document
                      </button>
                    </div>
                  </div>

                  {/* Sous-catégories */}
                  {cat.subcats?.map(sub => (
                    <div key={sub.id} style={{ borderBottom: '0.5px solid #1e2035' }}>
                      <div
                        onClick={() => toggleSubcat(cat.id, sub.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 10px 36px', cursor: 'pointer', background: '#13152a', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1a1c30'}
                        onMouseLeave={e => e.currentTarget.style.background = '#13152a'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <svg style={{ color: '#5DCAA5' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                          </svg>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{sub.name}</span>
                          <span style={{ fontSize: '11px', color: '#7c7c9a' }}>{sub.docs?.length || 0} doc(s)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          {perms.canEdit && (
                            <>
                              <button className="action-btn" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => openSubcatModal(cat.id, sub)}>Modifier</button>
                              <button className="action-btn danger" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => deleteSubcat(sub.id, sub.name)}>Supprimer</button>
                            </>
                          )}
                          <svg style={{ transform: sub.open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#7c7c9a' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>

                      {sub.open && (
                        <div style={{ background: '#0f1117' }}>
                          <button
                            onClick={() => openDocModal(cat.id, sub.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px 8px 52px', cursor: 'pointer', fontSize: '12px', color: '#7c7c9a', background: 'none', border: 'none', borderBottom: '0.5px solid #1e2035', fontFamily: 'inherit', width: '100%', textAlign: 'left', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#5865F2'; e.currentTarget.style.background = '#1e2035' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#7c7c9a'; e.currentTarget.style.background = 'none' }}
                          >
                            + Ajouter un document
                          </button>
                          {!sub.docs?.length && <div style={{ padding: '16px 20px 16px 52px', color: '#7c7c9a', fontSize: '12px' }}>Aucun document</div>}
                          {sub.docs?.map(doc => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px 10px 52px', borderBottom: '0.5px solid #1e2035', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#1a1c2e'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#16182a', border: '0.5px solid #2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                                {TYPE_ICONS[doc.type] || TYPE_ICONS.Autre}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{doc.name}</div>
                                <div style={{ fontSize: '11px', color: '#7c7c9a', marginTop: '2px' }}>{doc.type} · {formatDate(doc.created_at)}{doc.description ? ` · ${doc.description}` : ''}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="action-btn" style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>Ouvrir</a>}
                                {perms.canDelete && <button className="action-btn" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => openDocModal(cat.id, sub.id, doc)}>Modifier</button>}
                                {perms.canDelete && <button className="action-btn danger" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => deleteDoc(doc.id, doc.name)}>Supprimer</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Docs racine */}
                  {cat.rootDocs?.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: '0.5px solid #1e2035', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1c2e'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#0f1117', border: '0.5px solid #2e2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                        {TYPE_ICONS[doc.type] || TYPE_ICONS.Autre}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{doc.name}</div>
                        <div style={{ fontSize: '11px', color: '#7c7c9a', marginTop: '2px' }}>{doc.type} · {formatDate(doc.created_at)}{doc.description ? ` · ${doc.description}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="action-btn" style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>Ouvrir</a>}
                        {perms.canDelete && <button className="action-btn" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => openDocModal(cat.id, null, doc)}>Modifier</button>}
                        {perms.canDelete && <button className="action-btn danger" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => deleteDoc(doc.id, doc.name)}>Supprimer</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal catégorie */}
      {catModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setCatModal(false)}>
          <div className="modal">
            <h2>{editCatId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
            <div className="form-group">
              <label>Nom</label>
              <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="ex: Procédures internes" />
            </div>
            <div className="form-group">
              <label>Description (optionnel)</label>
              <input value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} placeholder="ex: Documents officiels" />
            </div>
            <div className="form-group">
              <label>Couleur</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setSelectedColor(c)} style={{ width: '28px', height: '28px', borderRadius: '7px', background: c, cursor: 'pointer', border: selectedColor === c ? '2px solid #fff' : '2px solid transparent', transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              {editCatId && <button className="btn-danger" onClick={() => deleteCat(editCatId, catForm.name)}>Supprimer</button>}
              <button className="btn-cancel" onClick={() => setCatModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={saveCat}>{editCatId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sous-catégorie */}
      {subcatModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setSubcatModal(false)}>
          <div className="modal">
            <h2>{editSubcatId ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}</h2>
            <div className="form-group">
              <label>Nom</label>
              <input value={subcatForm.name} onChange={e => setSubcatForm({ ...subcatForm, name: e.target.value })} placeholder="ex: Procédures internes" />
            </div>
            <div className="form-group">
              <label>Description (optionnel)</label>
              <input value={subcatForm.description} onChange={e => setSubcatForm({ ...subcatForm, description: e.target.value })} placeholder="ex: Sous-section DOJ" />
            </div>
            <div className="modal-actions">
              {editSubcatId && <button className="btn-danger" onClick={() => deleteSubcat(editSubcatId, subcatForm.name)}>Supprimer</button>}
              <button className="btn-cancel" onClick={() => setSubcatModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={saveSubcat}>{editSubcatId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal document */}
      {docModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setDocModal(false)}>
          <div className="modal">
            <h2>{editDocId ? 'Modifier le document' : 'Ajouter un document'}</h2>
            <div className="form-group">
              <label>Nom du document</label>
              <input value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} placeholder="ex: Règlement intérieur v2" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={docForm.type} onChange={e => setDocForm({ ...docForm, type: e.target.value })}>
                  <option>PDF</option><option>Word</option><option>Excel</option>
                  <option>Image</option><option>Lien</option><option>Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>URL (optionnel)</label>
                <input value={docForm.url} onChange={e => setDocForm({ ...docForm, url: e.target.value })} placeholder="https://..." type="url" />
              </div>
            </div>
            <div className="form-group">
              <label>Description (optionnel)</label>
              <textarea value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} placeholder="Décrivez ce document..." />
            </div>
            <div className="modal-actions">
              {editDocId && perms.canDelete && <button className="btn-danger" onClick={() => { deleteDoc(editDocId, docForm.name); setDocModal(false) }}>Supprimer</button>}
              <button className="btn-cancel" onClick={() => setDocModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={saveDoc}>{editDocId ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" style={{ background: toast.color }}>✓ {toast.msg}</div>}
    </div>
  )
}