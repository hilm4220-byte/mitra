'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react'

interface Therapist {
  id: string
  registrationId: string
  fullName: string
  whatsapp: string
  address: string
  gender: string
  experience: string
  workArea: string
  availability: string
  message?: string
  status: string
  joinedAt: string
  updatedAt: string
  registration?: {
    submittedAt?: string
    message?: string
  } | null
}

interface PaginatedResponse {
  success?: boolean
  data: Therapist[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
}

export default function AdminTherapists() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchTherapists(token, 1, search, statusFilter)
  }, [router])

  const fetchTherapists = async (token: string, page: number, search?: string, status?: string) => {
    try {
      setError('') // Reset error
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (search) params.append('search', search)
      if (status && status !== 'all') params.append('status', status)

      const response = await fetch(`/api/admin/therapists?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminData')
        router.push('/admin/login')
        return
      }

      const result: PaginatedResponse = await response.json()
      if (result.success) {
        setTherapists(result.data || [])
        setPagination(result.pagination)
        setCurrentPage(result.pagination.page)
      } else {
        setError(result.error || 'Gagal mengambil data')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      fetchTherapists(token, 1, search, statusFilter)
    }
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      fetchTherapists(token, 1, search, status)
    }
  }

  const handlePageChange = (page: number) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      fetchTherapists(token, page, search, statusFilter)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Belum ada data'
    
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Tanggal tidak valid'
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ReactNode }> = {
      'ACTIVE': { variant: 'default', label: 'Aktif', icon: <UserCheck className="h-3 w-3" /> },
      'INACTIVE': { variant: 'secondary', label: 'Tidak Aktif', icon: <UserX className="h-3 w-3" /> },
      'SUSPENDED': { variant: 'destructive', label: 'Disuspend', icon: <AlertCircle className="h-3 w-3" /> }
    }
    
    const config = variants[status] || { variant: 'secondary', label: status, icon: null }
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/therapists/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()
      if (result.success) {
        // Refresh data
        fetchTherapists(token, currentPage, search, statusFilter)
      } else {
        setError(result.error || 'Gagal memperbarui status')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memperbarui status')
    }
  }

  if (isLoading && therapists.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data terapis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Manajemen Terapis</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/registrations')}>
                <Users className="h-4 w-4 mr-2" />
                Pendaftaran
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari nama, WhatsApp, atau alamat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                  <SelectItem value="SUSPENDED">Disuspend</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Cari
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Therapists List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Terapis ({pagination.total})</CardTitle>
            <CardDescription>
              Halaman {currentPage} dari {pagination.pages || 1}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {therapists.map((therapist) => (
                <div key={therapist.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{therapist.fullName}</h3>
                        {getStatusBadge(therapist.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>WhatsApp:</strong> {therapist.whatsapp}</p>
                        <p><strong>Jenis Kelamin:</strong> {therapist.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
                        <p><strong>Pengalaman:</strong> {therapist.experience} tahun</p>
                        <p><strong>Area Kerja:</strong> {therapist.workArea}</p>
                        <p className="md:col-span-2"><strong>Alamat:</strong> {therapist.address}</p>
                        <p className="md:col-span-2"><strong>Ketersediaan:</strong> {therapist.availability}</p>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        <p>Bergabung: {formatDate(therapist.joinedAt)}</p>
                        <p>Didaftar: {formatDate(therapist.registration?.submittedAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/admin/therapists/${therapist.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detail
                      </Button>
                      {therapist.status === 'ACTIVE' && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleUpdateStatus(therapist.id, 'INACTIVE')}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Nonaktifkan
                        </Button>
                      )}
                      {therapist.status === 'INACTIVE' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleUpdateStatus(therapist.id, 'ACTIVE')}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Aktifkan
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {therapists.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada data terapis</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-700">
                  Menampilkan {((currentPage - 1) * pagination.limit) + 1} hingga {Math.min(currentPage * pagination.limit, pagination.total)} dari {pagination.total} data
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Halaman {currentPage} dari {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}