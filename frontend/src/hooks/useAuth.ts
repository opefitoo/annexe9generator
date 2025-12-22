import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import type { User, LoginCredentials } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (credentials: LoginCredentials) => {
    const { access_token } = await authApi.login(credentials)
    localStorage.setItem('token', access_token)
    const userData = await authApi.getCurrentUser()
    setUser(userData)
    navigate('/')
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const canEdit = user?.role === 'admin'

  return {
    user,
    loading,
    isAuthenticated: !!user,
    canEdit,
    login,
    logout,
  }
}
