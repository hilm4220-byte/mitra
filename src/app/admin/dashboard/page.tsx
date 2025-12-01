'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  UserCheck, 
  AlertCircle,
  LogOut,
  Eye,
  CheckCircle,
  Loader2,
  Settings,
  Phone,
  XCircle,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface DashboardStats {
  overview: {
    totalRegistrations: number
    pendingRegistrations: number
    approvedRegistrations: number
    rejectedRegistrations: number
    totalTherapists: number
    activeTherapists: number
    inactiveTherapists: number
    suspendedTherapists: number
  }
  recent: {
    registrations: Array<{
      id: string
      fullName: string
      whatsapp: string
      status: string
      submittedAt: string
    }>
    therapists: Array<{
      id: string
      fullName: string
      whatsapp: string
      status: string
      joinedAt: string
    }>
  }
  monthlyStats: Array<{
    month: string
    registrations: number
    approved: number
    rejected: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  // ✅ Check authentication from localStorage
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    
    console.log('🔐 Dashboard checking token:', token ? 'Found' : 'Not found') // Debug
    
    if (!token) {
      console.log('❌ No token, redirecting to login')
      window.location.href = '/admin/login'
      return
    }

    console.log('✅ Token found, fetching dashboard data')
    fetchDashboardData(token)
  }, [])

  const fetchDashboardData = async (token: string) => {
    try {
      console.log('📡 Fetching dashboard data with token:', token.substring(0, 20) + '...')
      
      const response = await fetch('/api/admin/dashboard', {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📥 Dashboard API response status:', response.status)

      if (response.status === 401) {
        console.log('❌ Unauthorized, clearing localStorage')
        // Token invalid, clear localStorage and redirect
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminData')
        window.location.href = '/admin/login'
        return
      }

      const result = await response.json()
      console.log('📊 Dashboard data received:', result.success)
      
      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Gagal mengambil data')
      }
    } catch (err) {
      console.error('💥 Dashboard fetch error:', err)
      setError('Terjadi kesalahan saat mengambil data dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Logout: clear localStorage
  const handleLogout = () => {
    setIsNavigating(true)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    setTimeout(() => {
      router.push('/admin/login')
    }, 300)
  }

  const handleViewRegistrations = () => {
    setIsNavigating(true)
    setTimeout(() => router.push('/admin/registrations'), 300)
  }

  const handleManageTherapists = () => {
    setIsNavigating(true)
    setTimeout(() => router.push('/admin/therapists'), 300)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      'PENDING': { variant: 'secondary', label: 'Menunggu' },
      'APPROVED': { variant: 'default', label: 'Disetujui' },
      'REJECTED': { variant: 'destructive', label: 'Ditolak' },
      'ACTIVE': { variant: 'default', label: 'Aktif' },
      'INACTIVE': { variant: 'secondary', label: 'Tidak Aktif' },
      'SUSPENDED': { variant: 'destructive', label: 'Disuspend' }
    }
    
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-gray-600 mb-4">
              {error || 'Terjadi kesalahan saat mengambil data dashboard'}
            </p>
            <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {isNavigating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className="text-lg font-medium">Memuat...</span>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard Admin PijatJogja</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleViewRegistrations}>
                <Eye className="h-4 w-4 mr-2" /> Pendaftaran
              </Button>
              <Button variant="outline" size="sm" onClick={handleManageTherapists}>
                <Users className="h-4 w-4 mr-2" /> Terapis
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/content')}>
                <Settings className="h-4 w-4 mr-2" /> Konten
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/contact')}>
                <Phone className="h-4 w-4 mr-2" /> Kontak
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Registrations Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendaftaran</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalRegistrations}</div>
              <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{stats.overview.pendingRegistrations} menunggu</span>
              </div>
            </CardContent>
          </Card>

          {/* Approved Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.overview.approvedRegistrations}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pendaftaran yang disetujui
              </p>
            </CardContent>
          </Card>

          {/* Rejected Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overview.rejectedRegistrations}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pendaftaran yang ditolak
              </p>
            </CardContent>
          </Card>

          {/* Active Therapists Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terapis Aktif</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.activeTherapists}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Dari {stats.overview.totalTherapists} total terapis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Aktivitas Terbaru</TabsTrigger>
            <TabsTrigger value="stats">Statistik Bulanan</TabsTrigger>
          </TabsList>

          {/* Recent Activity */}
          <TabsContent value="recent" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Registrations */}
              <Card>
                <CardHeader>
                  <CardTitle>Pendaftaran Terbaru</CardTitle>
                  <CardDescription>7 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recent.registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Belum ada pendaftaran dalam 7 hari terakhir
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {stats.recent.registrations.map((reg) => (
                        <div key={reg.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{reg.fullName}</p>
                            <p className="text-xs text-muted-foreground">{reg.whatsapp}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(reg.submittedAt)}
                            </p>
                          </div>
                          <div>{getStatusBadge(reg.status)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Therapists */}
              <Card>
                <CardHeader>
                  <CardTitle>Terapis Terbaru</CardTitle>
                  <CardDescription>7 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recent.therapists.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Belum ada terapis baru dalam 7 hari terakhir
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {stats.recent.therapists.map((therapist) => (
                        <div key={therapist.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{therapist.fullName}</p>
                            <p className="text-xs text-muted-foreground">{therapist.whatsapp}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(therapist.joinedAt)}
                            </p>
                          </div>
                          <div>{getStatusBadge(therapist.status)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monthly Stats */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Statistik 6 Bulan Terakhir</CardTitle>
                <CardDescription>Ringkasan pendaftaran per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.monthlyStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Belum ada data statistik
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.monthlyStats.map((stat) => (
                      <div key={stat.month} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium">{stat.month}</h4>
                          </div>
                          <Badge variant="outline">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {stat.registrations} total
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Disetujui</p>
                            <p className="text-lg font-semibold text-green-600">{stat.approved}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ditolak</p>
                            <p className="text-lg font-semibold text-red-600">{stat.rejected}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pending</p>
                            <p className="text-lg font-semibold text-gray-600">
                              {stat.registrations - stat.approved - stat.rejected}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}