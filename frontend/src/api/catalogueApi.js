const getMessage = (payload, fallback) => {
  if (typeof payload === 'string' && payload.trim()) return payload.trim()
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message.trim()
  if (typeof payload?.detail === 'string' && payload.detail.trim()) return payload.detail.trim()
  if (payload && typeof payload === 'object') {
    const values = Object.values(payload)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .map((value) => typeof value === 'object' ? (value.message || value.detail) : value)
      .filter(Boolean)
      .map(String)
    if (values.length) return values.join(' ')
  }
  return fallback
}

// Leave this empty locally so Vite's dev proxy continues to serve /api and
// /media. Render sets VITE_API_BASE_URL to the deployed Django service URL.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
export const backendUrl = (path) => `${API_BASE_URL}${path}`
export const apiUrl = (path) => backendUrl(`/api${path}`)

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = localStorage.getItem('token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const isFormData = options.body instanceof FormData
  if (!isFormData && options.body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(apiUrl(path), { ...options, headers })
  const responseText = await response.text()
  let payload
  try {
    payload = responseText ? JSON.parse(responseText) : null
  } catch {
    payload = responseText
  }
  if (!response.ok) {
    const error = new Error(getMessage(payload, `Request failed with status ${response.status}.`))
    error.status = response.status
    throw error
  }
  return payload
}

export const catalogueRequest = (path, options) => apiRequest(`/catalogue${path}`, options)

export const fetchCategories = () => catalogueRequest('/categories')
export const createCategory = (data) => catalogueRequest('/categories', { method: 'POST', body: JSON.stringify(data) })
export const updateCategory = (id, data) => catalogueRequest(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteCategory = (id) => catalogueRequest(`/categories/${id}`, { method: 'DELETE' })
export const fetchProducts = () => catalogueRequest('/products')
export const fetchProduct = (id) => catalogueRequest(`/products/${id}`)
export const fetchRecommendations = (productId) => apiRequest(
  `/ml/recommendations/?product_id=${encodeURIComponent(productId)}`,
)
export const createProduct = (formData) => catalogueRequest('/products', { method: 'POST', body: formData })
export const updateProduct = (id, formData) => catalogueRequest(`/products/${id}`, { method: 'PATCH', body: formData })
export const deleteProduct = (id) => catalogueRequest(`/products/${id}`, { method: 'DELETE' })

export async function fetchProfile() {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const response = await fetch(apiUrl('/auth/profile'), { headers })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(getMessage(payload, 'Unable to verify account access.'))
  return payload.user
}

export const requestEmailVerification = () => apiRequest('/auth/request-email-verification', { method: 'POST' })
export const verifyEmail = (token) => apiRequest('/auth/verify-email', {
  method: 'POST',
  body: JSON.stringify({ token }),
})
