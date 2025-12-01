'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Award,
  CheckCircle, 
  XCircle, 
  Loader2,
  Eye,
  Calendar
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

export default function RegistrationDetail() {
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  const router = useRouter()
  const params = useParams()

  // Load data
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchRegistration(token, params.id as string)
  }, [router, params.id])

  const fetchRegistration = async (token: string, id: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminData')
        router.push('/admin/login')
        return
      }

      const result = await response.json()
      if (result.success) setRegistration(result.data)
      else setError(result.error || 'Gagal mengambil data')
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (action: 'APPROVE' | 'REJECT') => {
    const token = localStorage.getItem('adminToken')
    if (!token || !registration) return

    if (action === 'REJECT' && !notes.trim()) {
      setError('Harap isi alasan penolakan')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/registrations/${registration.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, notes })
      })

      const result = await response.json()
      if (result.success) fetchRegistration(token, registration.id)
      else setError(result.error || 'Gagal menyimpan perubahan')
    } catch {
      setError('Terjadi kesalahan saat memproses data')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      'PENDING': { variant: 'secondary', label: 'Menunggu Persetujuan' },
      'APPROVED': { variant: 'default', label: 'Disetujui' },
      'REJECTED': { variant: 'destructive', label: 'Ditolak' }
    }
    
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant} className="text-sm">{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data pendaftaran...</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Alert className="mb-4">
              <AlertDescription>{error || 'Data tidak ditemukan'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/admin/registrations')}>
              Kembali ke Daftar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" onClick={() => router.push('/admin/registrations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            {getStatusBadge(registration.status)}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Personal Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informasi Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="text-sm text-gray-500">Nama Lengkap</label><p className="text-lg font-semibold">{registration.fullName}</p></div>
              <div><label className="text-sm text-gray-500">Jenis Kelamin</label><p className="text-lg">{registration.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p></div>
              <div className="md:col-span-2"><label className="text-sm text-gray-500">Alamat</label><p className="text-lg">{registration.address}</p></div>
              <div><label className="text-sm text-gray-500">WhatsApp</label><p className="text-lg">{registration.whatsapp}</p></div>
              <div><label className="text-sm text-gray-500">Pengalaman</label><p className="text-lg">{registration.experience} tahun</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Profesional Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Informasi Profesional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><label className="text-sm text-gray-500">Area Kerja</label><p className="text-lg">{registration.workArea}</p></div>
              <div><label className="text-sm text-gray-500">Ketersediaan</label><p className="text-lg whitespace-pre-line">{registration.availability}</p></div>
              {registration.message && <div><label className="text-sm text-gray-500">Pesan</label><p className="text-lg whitespace-pre-line">{registration.message}</p></div>}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center"><Clock className="h-5 w-5 mr-2" />Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-500 mt-1" />
                <div><p className="font-medium">Diajukan</p><p className="text-sm text-gray-500">{formatDate(registration.submittedAt)}</p></div>
              </div>
              {registration.updatedAt !== registration.submittedAt && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-green-500 mt-1" />
                  <div><p className="font-medium">Diperbarui</p><p className="text-sm text-gray-500">{formatDate(registration.updatedAt)}</p></div>
                </div>
              )}
              {registration.therapist && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div><p className="font-medium">Terapis Aktif</p><p className="text-sm text-gray-500">{formatDate(registration.therapist.joinedAt)}</p></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approve / Reject Buttons */}
        {registration.status === 'PENDING' && (
          <Card>
            <CardHeader>
              <CardTitle>Aksi Persetujuan</CardTitle>
              <CardDescription>Review dan ambil keputusan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={() => updateStatus('APPROVE')}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Setujui
                  </Button>

                  <Button 
                    variant="destructive"
                    onClick={() => updateStatus('REJECT')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Therapist Info */}
        {registration.therapist && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                Informasi Terapis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-800">Pendaftaran sudah disetujui dan terapis telah aktif.</p>
              <Button 
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/admin/therapists/${registration.therapist?.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Lihat Detail Terapis
              </Button>
            </CardContent>
          </Card>
        )}

      </main>

    </div>
  )
}
