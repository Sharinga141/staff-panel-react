const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
console.log('API_URL:', API_URL)

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers
    }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' })
}

export function loginWithDiscord() {
  window.location.href = `${API_URL}/auth/discord`
}

export function saveToken(token) {
  localStorage.setItem('token', token)
}

export function getUser() {
  const token = getToken()
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('token')
  window.location.href = '/login'
}