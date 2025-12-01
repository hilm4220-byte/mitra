'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Phone } from 'lucide-react'

interface ContactInfo {
  id: string
  type: string
  label: string
  value: string
  default_message?: string
  isActive: boolean
}

export default function AdminChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('081234567890')
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
        if (result.success) {
          // Cari contact dengan type 'whatsapp'
          const whatsappContact = result.data.find((contact: ContactInfo) => contact.type === 'whatsapp')
          if (whatsappContact) {
            setWhatsappNumber(whatsappContact.value)
            // Set pesan default dari database jika ada
            if (whatsappContact.default_message) {
              setDefaultMessage(whatsappContact.default_message)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatWhatsAppNumber = (number: string) => {
    const cleaned = number.replace(/[^0-9]/g, '')
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1)
    }
    if (cleaned.startsWith('62')) {
      return cleaned
    }
    return '62' + cleaned
  }

  const handleOpenWhatsApp = () => {
    const formattedNumber = formatWhatsAppNumber(whatsappNumber)
    const message = encodeURIComponent(defaultMessage)
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`
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
              <div className="w-2 h-2 rounded-full bg-green-300" />
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
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Hubungi Admin via WhatsApp</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Klik tombol di bawah untuk langsung terhubung dengan admin melalui WhatsApp
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Nomor: {whatsappNumber}
                  </p>
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
            )}
          </div>
        </div>
      )}
    </>
  )
}