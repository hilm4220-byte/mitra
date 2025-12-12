// lib/auth.ts
import { supabase } from './supabase'
import { useEffect, useState } from 'react'

export interface AdminData {
  id: string
  email: string
  fullName: string
  role: string
  avatar?: string
  createdAt: string
}

export class AuthService {
  // Get current admin data from localStorage
  static getAdminData(): AdminData | null {
    if (typeof window === 'undefined') return null
    
    const adminDataStr = localStorage.getItem('adminData')
    if (!adminDataStr) return null
    
    try {
      return JSON.parse(adminDataStr)
    } catch {
      return null
    }
  }

  // Get access token
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('adminToken')
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Logout
  static async logout() {
    try {
      // Call logout API
      await fetch('/api/admin/login', {
        method: 'DELETE',
      })
      
      // Clear localStorage
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminRefreshToken')
      localStorage.removeItem('adminData')
      
      // Sign out dari Supabase
      await supabase.auth.signOut()
      
      // Redirect to login
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force clear dan redirect meski ada error
      localStorage.clear()
      window.location.href = '/admin/login'
    }
  }

  // Refresh token
  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken')
      if (!refreshToken) return false

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (error || !data.session) {
        this.logout()
        return false
      }

      // Update tokens
      localStorage.setItem('adminToken', data.session.access_token)
      localStorage.setItem('adminRefreshToken', data.session.refresh_token)

      return true
    } catch (error) {
      console.error('Refresh token error:', error)
      this.logout()
      return false
    }
  }

  // Verify token validity
  static async verifyToken(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getUser()
      
      if (error || !data.user) {
        // Try refresh token
        return await this.refreshToken()
      }

      return true
    } catch (error) {
      console.error('Verify token error:', error)
      return false
    }
  }
}

// Hook untuk React components
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = AuthService.isAuthenticated()
      const data = AuthService.getAdminData()
      
      if (authenticated && data) {
        // Verify token is still valid
        const isValid = await AuthService.verifyToken()
        setIsAuthenticated(isValid)
        setAdminData(isValid ? data : null)
      } else {
        setIsAuthenticated(false)
        setAdminData(null)
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  return {
    isAuthenticated,
    adminData,
    loading,
    logout: AuthService.logout
  }
}