'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Eye, EyeOff, Loader2, LogIn, LogOut, User, Menu, X, Home, Info, Award, Users, HelpCircle, MessageSquare, FileText } from 'lucide-react'
import Image from 'next/image'

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [adminData, setAdminData] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const navigateToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false)
    
    if (typeof window === 'undefined') return
    
    if (pathname !== '/') {
      window.location.href = `/#${sectionId}`
    } else {
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const admin = localStorage.getItem('adminData')
    if (token && admin) {
      setIsLoggedIn(true)
      setAdminData(JSON.parse(admin))
    }

    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1)
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        localStorage.setItem('adminToken', result.token)
        localStorage.setItem('adminData', JSON.stringify(result.admin))
        setIsLoggedIn(true)
        setAdminData(result.admin)
        setIsLoginOpen(false)
        setFormData({ username: '', password: '' })
        router.push('/admin/dashboard')
      } else {
        setError(result.error || 'Login gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    setIsLoggedIn(false)
    setAdminData(null)
    router.push('/')
  }

  return (
    <header id="main-header" className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <a 
              href="/" 
              id="logo-link" 
              className="flex items-center hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="relative w-64 h-20 flex-shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="PijatJogja Logo" 
                  fill
                  className="object-contain object-left"
                  quality={100}
                  priority
                  unoptimized
                />
              </div>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              id="nav-home-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('hero-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              <Home className="w-4 h-4 mr-1" />
              Beranda
            </Button>
            <Button
              id="nav-highlights-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('highlights-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              Fitur
            </Button>
            <Button
              id="nav-about-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('about-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              <Info className="w-4 h-4 mr-1" />
              Tentang
            </Button>
            <Button
              id="nav-benefits-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('benefits-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              <Award className="w-4 h-4 mr-1" />
              Keuntungan
            </Button>
            <Button
              id="nav-how-to-join-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('how-to-join-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              Cara Gabung
            </Button>
            <Button
              id="nav-register-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('registration-form')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              <FileText className="w-4 h-4 mr-1" />
              Daftar
            </Button>
            <Button
              id="nav-testimonials-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('testimonials-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              <Users className="w-4 h-4 mr-1" />
              Testimoni
            </Button>
            <Button
              id="nav-faq-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('faq-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              FAQ
            </Button>
            <Button
              id="nav-contact-link"
              variant="ghost"
              size="sm"
              onClick={() => navigateToSection('contact-section')}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Kontak
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              id="mobile-menu-btn"
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            {isLoggedIn ? (
              <Button
                id="mobile-admin-dashboard-btn"
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="text-green-600 hover:text-green-700"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                id="mobile-login-btn"
                variant="outline"
                size="sm"
                onClick={() => setIsLoginOpen(true)}
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                <LogIn className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">{adminData?.fullName || adminData?.username}</span>
                </div>
                <Button
                  id="admin-dashboard-btn"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/dashboard')}
                  className="text-green-600 hover:text-green-700"
                >
                  Dashboard
                </Button>
                <Button
                  id="logout-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                id="login-btn"
                variant="outline"
                size="sm"
                onClick={() => setIsLoginOpen(true)}
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login Admin
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="flex flex-col py-4 space-y-2">
              <Button
                id="mobile-nav-home-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('hero-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </Button>
              <Button
                id="mobile-nav-highlights-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('highlights-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                Fitur
              </Button>
              <Button
                id="mobile-nav-about-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('about-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                <Info className="w-4 h-4 mr-2" />
                Tentang
              </Button>
              <Button
                id="mobile-nav-benefits-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('benefits-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                <Award className="w-4 h-4 mr-2" />
                Keuntungan
              </Button>
              <Button
                id="mobile-nav-how-to-join-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('how-to-join-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                Cara Gabung
              </Button>
              <Button
                id="mobile-nav-register-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('registration-form')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                <FileText className="w-4 h-4 mr-2" />
                Daftar
              </Button>
              <Button
                id="mobile-nav-testimonials-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('testimonials-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                <Users className="w-4 h-4 mr-2" />
                Testimoni
              </Button>
              <Button
                id="mobile-nav-faq-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('faq-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ
              </Button>
              <Button
                id="mobile-nav-contact-link"
                variant="ghost"
                size="sm"
                onClick={() => navigateToSection('contact-section')}
                className="justify-start text-gray-700 hover:text-green-600"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Kontak
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* ✅ FIXED LOGIN DIALOG - Solid Background */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent 
          className="sm:max-w-md bg-white border-2 border-gray-200 shadow-2xl"
          style={{ 
            backgroundColor: '#ffffff',
            opacity: 1,
            backdropFilter: 'none'
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-900">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Login Admin</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Masukkan username/email dan password Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="header-username" className="text-gray-700 font-medium">Username atau Email</Label>
              <Input
                id="header-username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="Masukkan username atau email"
                disabled={isLoading}
                className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                style={{ backgroundColor: '#ffffff' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="header-password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="header-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Masukkan password"
                  disabled={isLoading}
                  className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                  style={{ backgroundColor: '#ffffff' }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-600" />
                  )}
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
                  Login...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  )
}