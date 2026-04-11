import { logout } from '../lib/api'

export default function Pending() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f1117', flexDirection: 'column', gap: '24px', textAlign: 'center', padding: '20px'
    }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #EF9F27', margin: '0 auto', background: '#26215C' }}>
        <img src="/DOJ.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e0f0', marginBottom: '8px' }}>Compte en attente</div>
        <div style={{ fontSize: '14px', color: '#7c7c9a', lineHeight: 1.6, maxWidth: '400px' }}>
          Votre compte est en attente de validation par un administrateur.<br />
          Vous serez notifié dès que votre accès sera approuvé.
        </div>
      </div>
      <div style={{ background: '#EF9F2715', border: '0.5px solid #EF9F2740', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF9F27' }} />
        <span style={{ fontSize: '13px', color: '#EF9F27' }}>En attente de validation admin</span>
      </div>
      <button onClick={logout} style={{ background: 'none', border: '0.5px solid #2e2e4a', borderRadius: '9px', color: '#7c7c9a', fontSize: '13px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit' }}>
        Se déconnecter
      </button>
    </div>
  )
}