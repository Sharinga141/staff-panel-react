import { loginWithDiscord } from '../lib/api'

export default function Login() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f1117', flexDirection: 'column', gap: '32px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
          border: '3px solid #5865F2', margin: '0 auto 20px', background: '#26215C',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img
            src="/DOJ.png"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e0f0', letterSpacing: '0.06em' }}>
          RÉFÉRENCEMENT GOUV
        </div>
        <div style={{ fontSize: '12px', color: '#7c7c9a', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Panel d'administration
        </div>
      </div>

      <div style={{
        background: '#16182a', border: '0.5px solid #2e2e4a', borderRadius: '16px',
        padding: '36px', width: '100%', maxWidth: '380px', borderTop: '3px solid #5865F2'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#e2e0f0' }}>
          Connexion au panel
        </div>
        <div style={{ fontSize: '13px', color: '#7c7c9a', marginBottom: '28px', lineHeight: 1.6 }}>
          Connectez-vous avec votre compte Discord pour accéder au panel d'administration.
        </div>
        <button onClick={loginWithDiscord} style={{
          width: '100%', padding: '14px', background: '#5865F2', border: 'none',
          borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          fontFamily: 'inherit'
        }}>
          <i className="bi bi-box-arrow-in-right" style={{ fontSize: '22px' }} />
          Se connecter avec Discord
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#4a4a6a' }}>
        Accès réservé aux membres autorisés
      </div>
    </div>
  )
}