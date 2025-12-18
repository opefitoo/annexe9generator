import axios from 'axios'
import type { AuthToken, LoginCredentials, User, Order, OrderCreate, OrderListResponse, OrderFilters, Client, ClientCreate, ClientSearchResponse, OperatorConfig, OperatorConfigUpdate } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Public API (no auth required) for password reset and signature pages
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthToken> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  forgotPassword: async (email: string): Promise<{ message: string; success: boolean }> => {
    const response = await publicApi.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, newPassword: string, confirmPassword: string): Promise<{ message: string; success: boolean }> => {
    const response = await publicApi.post('/auth/reset-password', {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    })
    return response.data
  },
}

// Orders API
export const ordersApi = {
  list: async (filters: OrderFilters = {}): Promise<OrderListResponse> => {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.service_type) params.append('service_type', filters.service_type)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.page_size) params.append('page_size', filters.page_size.toString())

    const response = await api.get(`/orders/?${params.toString()}`)
    return response.data
  },

  get: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  getByReference: async (reference: string): Promise<Order> => {
    const response = await api.get(`/orders/reference/${reference}`)
    return response.data
  },

  create: async (data: OrderCreate): Promise<Order> => {
    const response = await api.post('/orders/', data)
    return response.data
  },

  update: async (id: string, data: Partial<OrderCreate>): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`)
  },

  archive: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/archive`)
    return response.data
  },
}

// Clients API
export const clientsApi = {
  search: async (query: string): Promise<ClientSearchResponse> => {
    const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`)
    return response.data
  },

  get: async (id: string): Promise<Client> => {
    const response = await api.get(`/clients/${id}`)
    return response.data
  },

  create: async (data: ClientCreate): Promise<Client> => {
    const response = await api.post('/clients/', data)
    return response.data
  },

  findOrCreate: async (data: ClientCreate): Promise<Client> => {
    const response = await api.post('/clients/find-or-create', data)
    return response.data
  },
}

// Operator Config API
export const operatorApi = {
  get: async (): Promise<OperatorConfig> => {
    const response = await api.get('/operator/')
    return response.data
  },

  update: async (data: OperatorConfigUpdate): Promise<OperatorConfig> => {
    const response = await api.put('/operator/', data)
    return response.data
  },
}

// PDF API
export const pdfApi = {
  generate: async (orderId: string): Promise<{ url: string; filename: string }> => {
    const response = await api.post(`/pdf/${orderId}/generate`)
    return response.data
  },

  getDownloadUrl: (orderId: string, regenerate = false): string => {
    const token = localStorage.getItem('token')
    return `${API_URL}/pdf/${orderId}/download?regenerate=${regenerate}&token=${token}`
  },

  getPreviewUrl: (orderId: string): string => {
    const token = localStorage.getItem('token')
    return `${API_URL}/pdf/${orderId}/preview?token=${token}`
  },
}

// Signatures API
export const signaturesApi = {
  // Authenticated: Generate a signature link for an order
  generateLink: async (orderId: string, hoursValid: number = 24): Promise<{ signature_url: string; expires_at: string }> => {
    const response = await api.post(`/signatures/${orderId}/generate-link?hours_valid=${hoursValid}`)
    return response.data
  },

  // Authenticated: Get signature status
  getStatus: async (orderId: string): Promise<{ has_client_signature: boolean; client_signature_date: string | null; has_operator_signature: boolean }> => {
    const response = await api.get(`/signatures/${orderId}/status`)
    return response.data
  },

  // Public: Get order details by signature token
  getOrderByToken: async (token: string): Promise<Order> => {
    const response = await publicApi.get(`/signatures/public/${token}`)
    return response.data
  },

  // Public: Submit signature
  submitSignature: async (token: string, signatureData: string): Promise<void> => {
    await publicApi.post(`/signatures/public/${token}`, { signature_data: signatureData })
  },
}

export default api
