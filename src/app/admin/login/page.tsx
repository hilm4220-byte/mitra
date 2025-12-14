// src/app/admin/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'

function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const token = localStorage.getItem('adminToken')
      if (token && typeof window !== 'undefined') {
        window.location.href = '/admin/dashboard'
      }
    } catch (err) {
      console.error('Error checking token:', err)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const email = formData.email?.trim()
    const password = formData.password

    if (!email || !password) {
      setError('Email dan password harus diisi')
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      console.log('Login response:', result)

      if (response.ok && result.success) {
        localStorage.setItem('adminToken', result.token || result.session?.access_token)
        
        if (result.session?.refresh_token) {
          localStorage.setItem('adminRefreshToken', result.session.refresh_token)
        }
        
        if (result.admin) {
          localStorage.setItem('adminData', JSON.stringify(result.admin))
        }
        
        console.log('✅ Login successful, token saved:', result.token?.substring(0, 20) + '...')
        window.location.href = '/admin/dashboard'
      } else {
        const errorMsg = result.error || result.message || 'Login gagal'
        console.error('❌ Login failed:', errorMsg)
        setError(errorMsg)
      }
    } catch (error) {
      console.error('💥 Fetch error:', error)
      setError('Terjadi kesalahan jaringan. Pastikan server berjalan.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      {/* CARD CONTAINER - Simplified structure */}
      <div className="w-full max-w-md">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin PijatJogja</h1>
          <p className="text-gray-600 mt-2">Login untuk mengelola data terapis</p>
        </div>

        {/* LOGIN FORM - Single solid white card */}
        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Login Admin</h2>
            <p className="text-gray-600 text-sm mt-1">Masukkan email dan password Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                required
                placeholder="admin@pijatjogja.com"
                disabled={isLoading}
                autoComplete="email"
                className="w-full bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  required
                  placeholder="Masukkan password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full pr-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-600" /> : <Eye className="h-4 w-4 text-gray-600" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses Login...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hubungi super admin jika Anda lupa password
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Powered by Supabase Authentication</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin