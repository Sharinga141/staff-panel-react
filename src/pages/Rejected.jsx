import { logout } from '../lib/api'

export default function Rejected() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f1117', flexDirection: 'column', gap: '24px', textAlign: 'center', padding: '20px'
    }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #E24B4A', margin: '0 auto', background: '#26215C' }}>
        <img src="/DOJ.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e0f0', marginBottom: '8px' }}>Accès refusé</div>
        <div style={{ fontSize: '14px', color: '#7c7c9a', lineHeight: 1.6, maxWidth: '400px' }}>
          Votre demande d'accès a été refusée par un administrateur.<br />
          Contactez un administrateur pour plus d'informations.
        </div>
      </div>
      <button onClick={logout} style={{ background: '#A32D2D1a', border: '0.5px solid #A32D2D40', borderRadius: '9px', color: '#E24B4A', fontSize: '13px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit' }}>
        Se déconnecter
      </button>
    </div>
  )
}