'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  MessageSquare,
  CheckCircle,
  Send,
  Smartphone
} from 'lucide-react'

interface WhatsAppTemplate {
  id: string
  type: string
  title: string
  message: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminWhatsApp() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchTemplates(token)
  }, [router])

  const fetchTemplates = async (token: string) => {
    try {
      const response = await fetch('/api/admin/whatsapp', {
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
      if (result.success) {
        setTemplates(result.data)
      } else {
        setError(result.error || 'Gagal mengambil data')
      }
    } catch (error) {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateChange = (id: string, field: 'title' | 'message', value: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === id ? { ...template, [field]: value } : template
      )
    )
  }

  const handleSave = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/whatsapp', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templates })
      })

      const result = await response.json()
      if (result.success) {
        setSuccess('Template WhatsApp berhasil disimpan!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || 'Gagal menyimpan template')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'registration_approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'registration_rejected':
        return <Send className="h-5 w-5 text-red-600" />
      case 'welcome_message':
        return <MessageSquare className="h-5 w-5 text-blue-600" />
      default:
        return <Smartphone className="h-5 w-5 text-gray-600" />
    }
  }

  const getTemplateLabel = (type: string) => {
    switch (type) {
      case 'registration_approved':
        return 'Pendaftaran Disetujui'
      case 'registration_rejected':
        return 'Pendaftaran Ditolak'
      case 'welcome_message':
        return 'Pesan Selamat Datang'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data template...</p>
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
              <Button variant="ghost" onClick={() => router.push('/admin/content')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Template WhatsApp</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Template
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getTemplateIcon(template.type)}
                  {getTemplateLabel(template.type)}
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Template untuk {getTemplateLabel(template.type).toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Judul Template</label>
                  <Input
                    value={template.title}
                    onChange={(e) => handleTemplateChange(template.id, 'title', e.target.value)}
                    className="mt-1"
                    placeholder="Masukkan judul template"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Pesan Template</label>
                  <Textarea
                    value={template.message}
                    onChange={(e) => handleTemplateChange(template.id, 'message', e.target.value)}
                    className="mt-1"
                    rows={4}
                    placeholder="Masukkan pesan template"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gunakan variabel seperti {`{nama}`} untuk personalisasi
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-sm whitespace-pre-line">{template.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Aksi cepat untuk mengelola template WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/registrations')}
              >
                <Send className="h-6 w-6" />
                <span>Test Pendaftaran</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/therapists')}
              >
                <MessageSquare className="h-6 w-6" />
                <span>Test Terapis</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
              >
                <Smartphone className="h-6 w-6" />
                <span>Test WhatsApp</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}