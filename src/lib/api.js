const API_URL = 'https://staff-panel-api.onrender.com'

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

export async function getSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`)
    return await res.json()
  } catch {
    return {}
  }
}