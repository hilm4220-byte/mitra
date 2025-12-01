'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  MessageCircle
} from 'lucide-react'

interface ContactInfo {
  id: string
  type: string
  label: string
  value: string
  default_message?: string  // TAMBAHAN BARU
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminContact() {
  const [mounted, setMounted] = useState(false)
  const [contacts, setContacts] = useState<ContactInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchContacts(token)
  }, [router])

  const fetchContacts = async (token: string) => {
    try {
      const response = await fetch('/api/admin/contact', {
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
        setContacts(result.data)
      } else {
        setError(result.error || 'Gagal mengambil data')
      }
    } catch (error) {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactChange = (type: string, field: 'label' | 'value' | 'default_message', value: string) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.type === type ? { ...contact, [field]: value } : contact
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
      const response = await fetch('/api/admin/contact', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contacts })
      })

      const result = await response.json()
      if (result.success) {
        setSuccess('Informasi kontak berhasil disimpan!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || 'Gagal menyimpan kontak')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'address':
        return <MapPin className="h-5 w-5 text-green-600" />
      case 'whatsapp':
        return <Phone className="h-5 w-5 text-green-600" />
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />
      default:
        return <Phone className="h-5 w-5 text-gray-600" />
    }
  }

  const getContactLabel = (type: string) => {
    switch (type) {
      case 'address':
        return 'Alamat'
      case 'whatsapp':
        return 'Nomor WhatsApp'
      case 'email':
        return 'Email'
      default:
        return type
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Manajemen Kontak</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : (
          <>
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
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {getContactIcon(contact.type)}
                      {getContactLabel(contact.type)}
                    </CardTitle>
                    <CardDescription>
                      Informasi {getContactLabel(contact.type).toLowerCase()} yang akan ditampilkan di website
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`label-${contact.type}`}>Label</Label>
                      <Input
                        id={`label-${contact.type}`}
                        value={contact.label}
                        onChange={(e) => handleContactChange(contact.type, 'label', e.target.value)}
                        className="mt-1"
                        placeholder="Masukkan label"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`value-${contact.type}`}>
                        {contact.type === 'whatsapp' ? 'Nomor WhatsApp' : 
                         contact.type === 'email' ? 'Alamat Email' : 
                         'Nilai'}
                      </Label>
                      <Input
                        id={`value-${contact.type}`}
                        value={contact.value}
                        onChange={(e) => handleContactChange(contact.type, 'value', e.target.value)}
                        className="mt-1"
                        placeholder={
                          contact.type === 'whatsapp' ? 'Contoh: 0812-3456-7890 atau 6281234567890' :
                          contact.type === 'email' ? 'Contoh: info@pijatjogja.com' :
                          'Masukkan nilai'
                        }
                      />
                      {contact.type === 'whatsapp' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Nomor ini akan digunakan untuk tombol chat WhatsApp di website. Format: 08xx-xxxx-xxxx atau 62xxxxxxxxxx
                        </p>
                      )}
                    </div>

                    {/* BAGIAN BARU: PESAN OTOMATIS WHATSAPP */}
                    {contact.type === 'whatsapp' && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-2 text-green-700">
                          <MessageCircle className="h-4 w-4" />
                          <Label htmlFor={`message-${contact.type}`} className="font-semibold">
                            Pesan Otomatis WhatsApp
                          </Label>
                        </div>
                        <Textarea
                          id={`message-${contact.type}`}
                          value={contact.default_message || ''}
                          onChange={(e) => handleContactChange(contact.type, 'default_message', e.target.value)}
                          className="mt-1 resize-none"
                          rows={4}
                          placeholder="Contoh: Halo, saya ingin bertanya tentang layanan PijatJogja..."
                        />
                        <p className="text-xs text-gray-500">
                          Pesan ini akan otomatis muncul saat pengunjung mengklik tombol chat WhatsApp di website
                        </p>
                        
                        {/* Preview Pesan */}
                        {contact.default_message && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-xs font-medium text-green-900 mb-2">Preview Pesan:</p>
                            <div className="bg-white p-3 rounded-lg border border-green-200 text-sm text-gray-700">
                              {contact.default_message}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {contact.type === 'whatsapp' && contact.value && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-900 mb-2">Preview Link WhatsApp:</p>
                        <p className="text-xs text-green-700 break-all">
                          https://wa.me/{contact.value.replace(/[^0-9]/g, '').replace(/^0/, '62')}
                          {contact.default_message && `?text=${encodeURIComponent(contact.default_message)}`}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const cleaned = contact.value.replace(/[^0-9]/g, '')
                            const formatted = cleaned.startsWith('0') ? '62' + cleaned.substring(1) : cleaned.startsWith('62') ? cleaned : '62' + cleaned
                            const message = contact.default_message ? `?text=${encodeURIComponent(contact.default_message)}` : ''
                            window.open(`https://wa.me/${formatted}${message}`, '_blank')
                          }}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Test Buka WhatsApp
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Informasi</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Nomor WhatsApp akan digunakan untuk tombol chat di website</li>
                  <li>• Format nomor bisa menggunakan 08xx-xxxx-xxxx atau 62xxxxxxxxxx</li>
                  <li>• Sistem akan otomatis mengkonversi format nomor ke format internasional</li>
                  <li>• Pastikan nomor WhatsApp aktif dan dapat menerima pesan</li>
                  <li>• <strong>Pesan otomatis akan langsung muncul di chat WhatsApp pengunjung</strong></li>
                  <li>• Pesan otomatis bersifat opsional, bisa dikosongkan jika tidak diperlukan</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}