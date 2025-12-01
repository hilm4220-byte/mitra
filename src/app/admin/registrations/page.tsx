'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit
} from 'lucide-react'

interface Registration {
  id: string
  fullName: string
  whatsapp: string
  address: string
  gender: string
  experience: string
  workArea: string
  availability: string
  message?: string
  status: string
  submittedAt: string
  updatedAt: string
  therapist?: {
    id: string
    status: string
    joinedAt: string
  }
}

interface PaginatedResponse {
  data: Registration[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  success?: boolean
  error?: string
}

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchRegistrations(token, 1, search, statusFilter)
  }, [router])

  const fetchRegistrations = async (token: string, page: number, search?: string, status?: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (search) params.append('search', search)
      if (status) params.append('status', status)

      const response = await fetch(`/api/admin/registrations?${params}`, {
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

      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || 'Gagal mengambil data')
        return
      }
      
      // Jika response memiliki structure { success, data, pagination }
      if (result.success !== undefined) {
        if (result.success) {
          setRegistrations(result.data)
          setPagination(result.pagination)
          setCurrentPage(result.pagination.page)
        } else {
          setError(result.error || 'Gagal mengambil data')
        }
      } 
      // Jika response langsung berisi { data, pagination }
      else if (result.data && result.pagination) {
        setRegistrations(result.data)
        setPagination(result.pagination)
        setCurrentPage(result.pagination.page)
      }
      // Jika response langsung array
      else if (Array.isArray(result)) {
        setRegistrations(result)
        setPagination({
          page: 1,
          limit: 10,
          total: result.length,
          pages: Math.ceil(result.length / 10)
        })
      }
    } catch (error) {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      fetchRegistrations(token, 1, search, statusFilter)
    }
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      // Jika "all", kirim undefined untuk tidak filter
      fetchRegistrations(token, 1, search, status === 'all' ? undefined : status)
    }
  }

  const handlePageChange = (page: number) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoading(true)
      fetchRegistrations(token, page, search, statusFilter)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      'PENDING': { variant: 'secondary', label: 'Menunggu' },
      'APPROVED': { variant: 'default', label: 'Disetujui' },
      'REJECTED': { variant: 'destructive', label: 'Ditolak' }
    }
    
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'APPROVE' })
      })

      const result = await response.json()
      if (result.success) {
        // Refresh data
        fetchRegistrations(token, currentPage, search, statusFilter)
      } else {
        setError(result.error || 'Gagal menyetujui pendaftaran')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menyetujui pendaftaran')
    }
  }

  const handleReject = async (id: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    const reason = prompt('Alasan penolakan (opsional):')
    if (reason === null) return // User cancelled

    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'REJECT', notes: reason })
      })

      const result = await response.json()
      if (result.success) {
        // Refresh data
        fetchRegistrations(token, currentPage, search, statusFilter)
      } else {
        setError(result.error || 'Gagal menolak pendaftaran')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menolak pendaftaran')
    }
  }

  const handleEditStatus = (registration: Registration) => {
    setSelectedRegistration(registration)
    setEditStatus(registration.status)
    setEditNotes('')
    setEditDialogOpen(true)
  }

  const handleSaveStatus = async () => {
    if (!selectedRegistration) return
    
    const token = localStorage.getItem('adminToken')
    if (!token) return

    setIsSaving(true)
    setError('') // Clear previous errors
    
    try {
      // Konversi status ke action seperti handleApprove dan handleReject
      let action = ''
      if (editStatus === 'APPROVED') action = 'APPROVE'
      else if (editStatus === 'REJECTED') action = 'REJECT'
      else if (editStatus === 'PENDING') action = 'PENDING'

      // Validasi action sebelum dikirim
      if (!action) {
        setError('Status tidak valid')
        setIsSaving(false)
        return
      }

      const body: any = { action }
      
      // Tambahkan notes jika ada
      if (editNotes) {
        body.notes = editNotes
      }

      console.log('Sending request:', {
        url: `/api/admin/registrations/${selectedRegistration.id}`,
        body: body
      })

      const response = await fetch(`/api/admin/registrations/${selectedRegistration.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()
      
      console.log('Response:', {
        ok: response.ok,
        status: response.status,
        result: result
      })
      
      if (response.ok || result.success) {
        setEditDialogOpen(false)
        setSelectedRegistration(null)
        setEditStatus('')
        setEditNotes('')
        // Refresh data
        fetchRegistrations(token, currentPage, search, statusFilter)
      } else {
        setError(result.error || result.message || 'Gagal mengubah status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setError('Terjadi kesalahan saat mengubah status')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && registrations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data pendaftaran...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Manajemen Pendaftaran</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/therapists')}>
                <Users className="h-4 w-4 mr-2" />
                Terapis
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
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
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
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Registrations List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pendaftaran ({pagination.total})</CardTitle>
            <CardDescription>
              Halaman {currentPage} dari {pagination.pages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div key={registration.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{registration.fullName}</h3>
                        {getStatusBadge(registration.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          <strong>WhatsApp:</strong>{' '}
                          <a 
                            href={`https://wa.me/${registration.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 hover:underline"
                          >
                            {registration.whatsapp}
                          </a>
                        </p>
                        <p><strong>Jenis Kelamin:</strong> {registration.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
                        <p><strong>Pengalaman:</strong> {registration.experience} tahun</p>
                        <p><strong>Area Kerja:</strong> {registration.workArea}</p>
                        <p className="md:col-span-2"><strong>Alamat:</strong> {registration.address}</p>
                        <p className="md:col-span-2"><strong>Ketersediaan:</strong> {registration.availability}</p>
                        {registration.message && (
                          <p className="md:col-span-2"><strong>Pesan:</strong> {registration.message}</p>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        <p>Didaftar: {formatDate(registration.submittedAt)}</p>
                        {registration.updatedAt !== registration.submittedAt && (
                          <p>Diperbarui: {formatDate(registration.updatedAt)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/admin/registrations/${registration.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detail
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditStatus(registration)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Status
                      </Button>
                      {registration.status === 'PENDING' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleApprove(registration.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Setujui
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleReject(registration.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Tolak
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {registrations.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada data pendaftaran</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
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
                  <span className="text-sm">
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

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Status Pendaftaran</DialogTitle>
            <DialogDescription>
              Ubah status pendaftaran untuk {selectedRegistration?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan atau alasan perubahan status..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveStatus}
              disabled={isSaving || !editStatus}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}