'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Phone } from 'lucide-react'

interface ContactInfo {
  id: string
  type: string
  label: string
  value: string
  default_message?: string  // snake_case dari database
  defaultMessage?: string   // camelCase dari API conversion
  isActive: boolean
}

export default function AdminChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [defaultMessage, setDefaultMessage] = useState('Halo, saya ingin bertanya tentang layanan PijatJogja')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWhatsAppData()
  }, [])

  const fetchWhatsAppData = async () => {
    try {
      setIsLoading(true)
      // Ambil dari API contact yang sama dengan section Hubungi Kami
      const response = await fetch('/api/contact')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          console.log('📞 Fetched contact data:', result.data)
          
          // Cari contact dengan type 'whatsapp'
          const whatsappContact = result.data.find((contact: ContactInfo) => contact.type === 'whatsapp')
          
          if (whatsappContact) {
            console.log('✅ WhatsApp contact found:', whatsappContact)
            
            // Set nomor WhatsApp
            setWhatsappNumber(whatsappContact.value || '')
            
            // Set pesan default dari database jika ada (support kedua format)
            const message = whatsappContact.default_message || 
                           whatsappContact.defaultMessage || 
                           'Halo, saya ingin bertanya tentang layanan PijatJogja'
            
            setDefaultMessage(message)
            
            console.log('💬 Message set:', message)
          } else {
            console.warn('⚠️ WhatsApp contact not found in data')
          }
        }
      } else {
        console.error('❌ API response not ok:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching WhatsApp data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatWhatsAppNumber = (number: string) => {
    if (!number) return ''
    
    // Hapus semua karakter non-digit
    const cleaned = number.replace(/[^0-9]/g, '')
    
    // Konversi ke format internasional
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1)
    }
    if (cleaned.startsWith('62')) {
      return cleaned
    }
    return '62' + cleaned
  }

  const handleOpenWhatsApp = () => {
    if (!whatsappNumber) {
      console.error('❌ Nomor WhatsApp tidak tersedia')
      return
    }
    
    const formattedNumber = formatWhatsAppNumber(whatsappNumber)
    const message = encodeURIComponent(defaultMessage)
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`
    
    console.log('📱 Opening WhatsApp:', {
      originalNumber: whatsappNumber,
      formattedNumber: formattedNumber,
      message: defaultMessage,
      url: whatsappUrl
    })
    
    window.open(whatsappUrl, '_blank')
    setIsOpen(false)
  }

  return (
    <>
      {/* Chat Button */}
      <Button
        id="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg z-50 flex items-center justify-center"
        size="lg"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chat-window"
          className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col"
        >
          {/* Chat Header */}
          <div className="bg-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <h3 className="font-semibold">Chat Admin</h3>
            </div>
            <Button
              id="chat-close-btn"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-green-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : whatsappNumber ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Hubungi Admin via WhatsApp</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Klik tombol di bawah untuk langsung terhubung dengan admin melalui WhatsApp
                  </p>
                  {whatsappNumber && (
                    <p className="text-xs text-gray-500 mb-4">
                      Nomor: {whatsappNumber}
                    </p>
                  )}
                  {defaultMessage && defaultMessage !== 'Halo, saya ingin bertanya tentang layanan PijatJogja' && (
                    <p className="text-xs text-green-600 mb-2">
                      💬 Pesan otomatis akan dikirim
                    </p>
                  )}
                </div>
                <Button
                  id="whatsapp-open-btn"
                  onClick={handleOpenWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Buka WhatsApp
                </Button>
                <p className="text-xs text-gray-500">
                  Anda akan diarahkan ke aplikasi WhatsApp
                </p>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-sm">Nomor WhatsApp belum tersedia</p>
                <p className="text-xs mt-2">Silakan hubungi administrator</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}