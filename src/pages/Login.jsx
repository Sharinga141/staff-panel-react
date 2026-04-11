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
          <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          Se connecter avec Discord
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#4a4a6a' }}>
        Accès réservé aux membres autorisés
      </div>
    </div>
  )
}