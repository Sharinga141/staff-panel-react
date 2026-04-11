import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { logout, api } from '../lib/api'
import { getPerms, getRoleBadgeClass } from '../lib/perms'
import { useSettings } from './SettingsContext'

export default function Topbar({ user, userRole }) {
  const [clock, setClock] = useState('')
  const [editNameModal, setEditNameModal] = useState(false)
  const [editLogoModal, setEditLogoModal] = useState(false)
  const [nameForm, setNameForm] = useState({ panel_name: '', panel_subtitle: '' })
  const [logoUrl, setLogoUrl] = useState('')
  const [toast, setToast] = useState(null)
  const location = useLocation()
  const perms = getPerms(userRole)
  const { settings, updateSetting } = useSettings()
  const isAdmin = userRole === 'Admin' || userRole === 'Superadmin'

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setClock(
        now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
        ' — ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  function showToast(msg, color = '#1D9E75') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 2500)
  }

  function openNameModal() {
    if (!isAdmin) return
    setNameForm({ panel_name: settings.panel_name || '', panel_subtitle: settings.panel_subtitle || '' })
    setEditNameModal(true)
  }

  function openLogoModal() {
    if (!isAdmin) return
    setLogoUrl(settings.panel_logo || '')
    setEditLogoModal(true)
  }

  async function saveName() {
    try {
      await api.put('/settings/panel_name', { value: nameForm.panel_name })
      await api.put('/settings/panel_subtitle', { value: nameForm.panel_subtitle })
      updateSetting('panel_name', nameForm.panel_name)
      updateSetting('panel_subtitle', nameForm.panel_subtitle)
      setEditNameModal(false)
      showToast('Nom mis à jour')
    } catch { showToast('Erreur', '#E24B4A') }
  }

  async function saveLogo() {
    try {
      await api.put('/settings/panel_logo', { value: logoUrl })
      updateSetting('panel_logo', logoUrl)
      setEditLogoModal(false)
      showToast('Logo mis à jour')
    } catch { showToast('Erreur', '#E24B4A') }
  }

  const username = user?.username || 'Utilisateur'
  const avatar = user?.avatar_url
  const badgeClass = getRoleBadgeClass(userRole)
  const logoSrc = settings.panel_logo || '/DOJ.png'

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/membres', label: 'Membres' },
    { to: '/referents', label: 'Référents', perm: 'seeReferents' },
    { to: '/registres', label: 'Registres' },
    { to: '/planning', label: 'Planning' },
    { to: '/roles', label: 'Rôles', perm: 'seeRoles' },
    { to: '/logs', label: 'Logs', perm: 'seeLogs' },
  ]

  return (
    <>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 28px', background: '#16182a', borderBottom: '2px solid #5865F2',
        height: '72px', flexShrink: 0, position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            paddingRight: '24px', borderRight: '0.5px solid #2e2e4a',
            marginRight: '6px', height: '100%'
          }}>
            <div
              onClick={openLogoModal}
              style={{
                width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden',
                background: '#26215C', border: '2px solid #5865F2', flexShrink: 0,
                cursor: isAdmin ? 'pointer' : 'default', position: 'relative'
              }}
              title={isAdmin ? 'Cliquer pour modifier le logo' : ''}
            >
              <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src = '/DOJ.png'} />
              {isAdmin && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%'
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <i className="bi bi-pencil-fill" style={{ fontSize: '16px', color: 'white' }} />
                </div>
              )}
            </div>
            <div onClick={openNameModal} style={{ cursor: isAdmin ? 'pointer' : 'default' }} title={isAdmin ? 'Cliquer pour modifier le nom' : ''}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e0f0', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {settings.panel_name || 'RÉFÉRENCEMENT GOUV'}
                {isAdmin && <i className="bi bi-pencil-fill" style={{ fontSize: '11px', color: '#7c7c9a' }} />}
              </div>
              <div style={{ fontSize: '9px', color: '#7c7c9a', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '1px' }}>
                {settings.panel_subtitle || "Panel d'administration"}
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {navLinks.map(link => {
              if (link.perm && !perms[link.perm]) return null
              const active = location.pathname === link.to
              return (
                <Link key={link.to} to={link.to} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 18px', height: '100%',
                  color: active ? '#EF9F27' : '#7c7c9a',
                  fontSize: '12px', fontWeight: 500,
                  borderBottom: active ? '3px solid #EF9F27' : '3px solid transparent',
                  transition: 'all 0.15s', whiteSpace: 'nowrap', textDecoration: 'none'
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e2e0f0'; e.currentTarget.style.background = '#1e2035' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#7c7c9a'; e.currentTarget.style.background = 'transparent' } }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#7c7c9a', textAlign: 'right', lineHeight: 1.5 }}>{clock}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e2035', borderRadius: '9px', padding: '5px 12px', border: '0.5px solid #2e2e4a' }}>
            {avatar
              ? <img src={avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #5865F2' }} />
              : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#AFA9EC', border: '1.5px solid #5865F2' }}>{username[0]?.toUpperCase()}</div>
            }
            <span style={{ fontSize: '12px', fontWeight: 500 }}>{username}</span>
            <div style={{ width: '0.5px', height: '16px', background: '#2e2e4a' }} />
            <span className={`badge ${badgeClass}`} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '6px' }}>{userRole}</span>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#E24B4A', cursor: 'pointer', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
            <i className="bi bi-box-arrow-right" style={{ fontSize: '17px' }} />
          </button>
        </div>
      </div>

      {/* Modal nom */}
      {editNameModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setEditNameModal(false)}>
          <div className="modal">
            <h2>Modifier le nom du panel</h2>
            <div className="form-group">
              <label>Nom principal</label>
              <input value={nameForm.panel_name} onChange={e => setNameForm({ ...nameForm, panel_name: e.target.value })} placeholder="RÉFÉRENCEMENT GOUV" />
            </div>
            <div className="form-group">
              <label>Sous-titre</label>
              <input value={nameForm.panel_subtitle} onChange={e => setNameForm({ ...nameForm, panel_subtitle: e.target.value })} placeholder="Panel d'administration" />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditNameModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={saveName}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal logo */}
      {editLogoModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setEditLogoModal(false)}>
          <div className="modal">
            <h2>Modifier le logo</h2>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #5865F2', background: '#26215C' }}>
                <img src={logoUrl || '/DOJ.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src = '/DOJ.png'} />
              </div>
            </div>
            <div className="form-group">
              <label>URL de l'image</label>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://exemple.com/logo.png" />
            </div>
            <div style={{ fontSize: '11px', color: '#7c7c9a', marginBottom: '10px' }}>
              Entrez l'URL directe d'une image (PNG, JPG). L'aperçu se met à jour automatiquement.
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditLogoModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={saveLogo}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" style={{ background: toast.color }}>✓ {toast.msg}</div>}
    </>
  )
}