'use client'

// React & Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

// Icons
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Award, 
  CheckCircle, 
  Star, 
  MessageCircle, 
  ChevronRight, 
  Sparkles, 
  Heart, 
  Shield, 
  Zap, 
  Image, 
  Loader2 
} from 'lucide-react'

// Custom Hooks
import { useContent } from '@/hooks/use-content'

// Type untuk Contact
interface ContactItem {
  id: string
  type: string
  label: string
  value: string
  default_message?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function Home() {
  const router = useRouter()
  const { data: contentData, isLoading: contentLoading, getBenefits } = useContent()
  
  // State untuk form
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    address: '',
    gender: '',
    experience: '',
    workArea: '',
    availability: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  // State untuk contact section
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [contactError, setContactError] = useState('')

  // Fetch contacts untuk section contact
  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contact')
      const result = await response.json()
      
      console.log('📞 API Contact Response:', result)
      
      if (result.success && result.data) {
        console.log('✅ Contacts loaded:', result.data)
        console.log('📊 Total contacts:', result.data.length)
        
        // Log each contact type
        result.data.forEach((contact: ContactItem) => {
          console.log(`   🔹 ${contact.type}: ${contact.value}`)
        })
        
        setContacts(result.data)
        
        // Verify state after set
        setTimeout(() => {
          console.log('🔄 State after set:', result.data)
        }, 100)
      } else {
        console.error('❌ No data received')
        setContactError('Gagal mengambil data kontak')
      }
    } catch (err) {
      console.error('❌ Error fetching contacts:', err)
      setContactError('Terjadi kesalahan')
    } finally {
      setIsLoadingContacts(false)
    }
  }

  // Get contact by type
  const getContactByType = (type: string): ContactItem | undefined => {
    return contacts.find(c => c.type === type && c.isActive)
  }

  const scrollToForm = () => {
    const formElement = document.getElementById('registration-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleOpenChat = () => {
    const whatsappContact = getContactByType('whatsapp')
    
    if (!whatsappContact?.value) {
      alert('Nomor WhatsApp belum tersedia')
      return
    }

    // Clean dan format nomor
    const cleaned = whatsappContact.value.replace(/[^0-9]/g, '')
    const formatted = cleaned.startsWith('0') 
      ? '62' + cleaned.substring(1) 
      : cleaned.startsWith('62') 
      ? cleaned 
      : '62' + cleaned

    // Buat URL dengan default message jika ada
    const message = whatsappContact.default_message 
      ? `?text=${encodeURIComponent(whatsappContact.default_message)}` 
      : ''
    
    const whatsappUrl = `https://wa.me/${formatted}${message}`
    window.open(whatsappUrl, '_blank')
  }

  const sanitizePhoneNumber = (value: string) => value.replace(/[^0-9]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus('success')
        setSubmitMessage(result.message)
        // Reset form
        setFormData({
          fullName: '',
          whatsapp: '',
          address: '',
          gender: '',
          experience: '',
          workArea: '',
          availability: '',
          message: ''
        })
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.error || 'Terjadi kesalahan saat mengirim formulir')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const benefits = getBenefits()

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat halaman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Hero Section */}
      <section id="hero-section" className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <img 
            src="/hero-massage.jpg" 
            alt="Professional Massage Therapy" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Komunitas Terapis Profesional Jogja
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Bergabung Bersama Komunitas Terapis Profesional di Jogja
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              Nikmati penghasilan tinggi, jadwal fleksibel, dan dukungan penuh dari tim PijatJogja.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button id="hero-register-btn" size="lg" onClick={scrollToForm} className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold">
                Daftar Jadi Mitra Sekarang
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                id="hero-chat-btn" 
                size="lg" 
                variant="outline" 
                onClick={handleOpenChat} 
                className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-medium"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                <span>Chat Admin</span>
              </Button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto">
              <p className="text-lg mb-4">💆‍♀️ Jadilah bagian dari jaringan layanan pijat panggilan terbesar di Yogyakarta.</p>
              <p className="text-xl font-semibold">✅ Daftar Sekarang & Mulai Dapat Order!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight Section */}
      <section id="highlights-section" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card id="highlight-order" className="text-center p-6 border-2 border-green-100 hover:border-green-300 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Order Banyak & Stabil</h3>
              <p className="text-gray-600">Ratusan pelanggan baru setiap minggu!</p>
            </Card>
            <Card id="highlight-flexible" className="text-center p-6 border-2 border-green-100 hover:border-green-300 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Waktu Fleksibel</h3>
              <p className="text-gray-600">Terapis bebas atur jadwal kerja sendiri.</p>
            </Card>
            <Card id="highlight-income" className="text-center p-6 border-2 border-green-100 hover:border-green-300 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Pendapatan Tinggi</h3>
              <p className="text-gray-600">Komisi menarik + bonus loyalitas.</p>
            </Card>
            <Card id="highlight-training" className="text-center p-6 border-2 border-green-100 hover:border-green-300 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Pelatihan & Dukungan</h3>
              <p className="text-gray-600">Bimbingan profesional agar makin berkembang.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Tentang Kami */}
      <section id="about-section" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Tentang PijatJogja</h2>
              <div className="w-24 h-1 bg-green-500 mx-auto"></div>
            </div>
            <Card className="p-8">
              <CardContent className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-lg leading-relaxed">
                      PijatJogja adalah layanan pijat panggilan profesional yang sudah beroperasi sejak 2020, melayani pelanggan di seluruh area Yogyakarta dan sekitarnya.
                    </p>
                    <p className="text-lg leading-relaxed">
                      Kami percaya bahwa terapis pijat adalah mitra utama kesuksesan kami. Karena itu, kami berkomitmen memberikan sistem kerja yang adil, transparan, dan menguntungkan bagi semua mitra.
                    </p>
                    <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
                      <p className="text-lg font-medium text-green-900">
                        Bersama PijatJogja, Anda tidak hanya bekerja — Anda berkembang, dihargai, dan menjadi bagian dari keluarga besar.
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <img 
                      src="/about-team.jpg" 
                      alt="Tim PijatJogja" 
                      className="w-full h-auto rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Keuntungan Bergabung */}
      <section id="benefits-section" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Keuntungan Jadi Mitra PijatJogja</h2>
            <div className="w-24 h-1 bg-green-500 mx-auto"></div>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                {[
                  { icon: Star, title: "Order Rutin & Terjamin", desc: "Sistem otomatis mencocokkan pelanggan terdekat.", id: "benefit-order" },
                  { icon: Clock, title: "Kerja Sesuai Waktu Anda", desc: "Bebas pilih hari dan jam kerja.", id: "benefit-flexible" },
                  { icon: DollarSign, title: "Pembayaran Cepat & Transparan", desc: "Pembagian hasil jelas, langsung ke rekening.", id: "benefit-payment" }
                ].map((benefit, index) => (
                  <Card key={index} id={benefit.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => scrollToForm()}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                <img 
                  src="/benefits-income.jpg" 
                  alt="Pendapatan Tinggi" 
                  className="w-full h-64 object-cover rounded-xl shadow-lg mb-6"
                />
                {[
                  { icon: Award, title: "Pelatihan & Sertifikasi", desc: "Gratis! Biar makin profesional dan dipercaya pelanggan.", id: "benefit-training" },
                  { icon: Heart, title: "Support Komunitas", desc: "Grup komunitas dan mentor siap bantu kapan pun.", id: "benefit-support" },
                  { icon: Shield, title: "Keamanan Terjamin", desc: "Sistem keamanan dan asuransi untuk semua mitra.", id: "benefit-security" }
                ].map((benefit, index) => (
                  <Card key={index} id={benefit.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => scrollToForm()}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <img 
                src="/benefits-flexible.jpg" 
                alt="Waktu Fleksibel" 
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
              <img 
                src="/benefits-training.jpg" 
                alt="Pelatihan Profesional" 
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
            </div>
            <div className="text-center mt-12">
              <p className="text-xl font-semibold text-green-600 mb-4">👉 Jadilah bagian dari ribuan terapis sukses di PijatJogja!</p>
              <Button id="benefits-join-btn" size="lg" onClick={scrollToForm} className="bg-green-600 hover:bg-green-700 px-8 py-3">
                Gabung Sekarang
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Bergabung */}
      <section id="how-to-join-section" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Cara Jadi Mitra PijatJogja</h2>
            <div className="w-24 h-1 bg-green-500 mx-auto"></div>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Daftar Online", desc: "Isi formulir pendaftaran di bawah ini.", id: "step-1" },
                { step: "2", title: "Verifikasi Data", desc: "Tim kami akan menghubungi Anda untuk verifikasi dan wawancara singkat.", id: "step-2" },
                { step: "3", title: "Pelatihan & Aktivasi Akun", desc: "Setelah lulus seleksi, Anda akan mengikuti orientasi dan langsung bisa menerima order!", id: "step-3" }
              ].map((item, index) => (
                <div key={index} id={item.id} className="text-center cursor-pointer" onClick={() => scrollToForm()}>
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button id="how-to-join-form-btn" size="lg" onClick={scrollToForm} className="bg-green-600 hover:bg-green-700 px-8 py-3">
                Isi Formulir Pendaftaran Sekarang
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Formulir Pendaftaran */}
      <section id="registration-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Formulir Pendaftaran Mitra</h2>
              <div className="w-24 h-1 bg-green-500 mx-auto"></div>
              <p className="text-lg text-gray-600 mt-4">✍️ Ayo Gabung Sekarang! Tim kami akan memproses pendaftaran Anda dalam waktu 1x24 jam.</p>
            </div>
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Nama Lengkap *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      placeholder="08xx-xxxx-xxxx"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Alamat Domisili *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="gender">Jenis Kelamin *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Laki-laki</SelectItem>
                        <SelectItem value="female">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="experience">Pengalaman Pijat *</Label>
                    <Select value={formData.experience} onValueChange={(value) => handleSelectChange('experience', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih pengalaman" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Belum ada pengalaman</SelectItem>
                        <SelectItem value="1">1 tahun</SelectItem>
                        <SelectItem value="2">2 tahun</SelectItem>
                        <SelectItem value="3">3 tahun</SelectItem>
                        <SelectItem value="4">4 tahun</SelectItem>
                        <SelectItem value="5+">5+ tahun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="workArea">Pilihan Area Kerja *</Label>
                  <Select value={formData.workArea} onValueChange={(value) => handleSelectChange('workArea', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih area kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jogja-kota">Jogja Kota</SelectItem>
                      <SelectItem value="sleman">Sleman</SelectItem>
                      <SelectItem value="bantul">Bantul</SelectItem>
                      <SelectItem value="kulon-progo">Kulon Progo</SelectItem>
                      <SelectItem value="gunung-kidul">Gunung Kidul</SelectItem>
                      <SelectItem value="semua">Semua Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="availability">Jadwal Ketersediaan *</Label>
                  <Textarea
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    rows={2}
                    placeholder="Contoh: Senin-Jumat, jam 9 pagi - 8 malam"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Pesan Tambahan</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                    placeholder="Ceritakan sedikit tentang diri Anda atau pertanyaan yang ingin ditanyakan"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Catatan:</strong> Anda akan diminta untuk mengupload foto KTP dan foto diri setelah submit formulir ini.
                  </p>
                </div>

                <Button id="submit-registration-btn" type="submit" size="lg" className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
              
              {submitStatus === 'success' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">{submitMessage}</p>
                  </div>
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 font-medium">{submitMessage}</p>
                  </div>
                </div>
              )}
            </Card>
            <div className="text-center mt-8">
              <p className="text-lg font-medium text-gray-700">
                Jadilah bagian dari keluarga besar PijatJogja — Pijat Profesional, Penghasilan Maksimal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimoni Mitra */}
      <section id="testimonials-section" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Cerita Sukses Mitra Kami</h2>
            <div className="w-24 h-1 bg-green-500 mx-auto"></div>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card id="testimonial-sinta" className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">
                    "Semenjak gabung PijatJogja, penghasilan saya stabil setiap minggu. Jadwal kerja juga fleksibel, bisa tetap urus keluarga."
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-orange-800 font-bold">S</span>
                    </div>
                    <div>
                      <p className="font-semibold">Sinta</p>
                      <p className="text-sm text-gray-600">Terapis Pijat Jogja Barat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card id="testimonial-rudi" className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">
                    "Dulu bingung cari pelanggan sendiri. Sekarang order datang terus lewat aplikasi."
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-blue-800 font-bold">R</span>
                    </div>
                    <div>
                      <p className="font-semibold">Rudi</p>
                      <p className="text-sm text-gray-600">Terapis Pijat Sleman</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="text-center mt-12">
              <p className="text-xl font-semibold text-green-600 mb-4">🌟 Kini giliran Anda!</p>
              <Button id="testimonials-join-btn" size="lg" onClick={scrollToForm} className="bg-green-600 hover:bg-green-700 px-8 py-3">
                Gabung Sekarang
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq-section" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Pertanyaan yang Sering Diajukan</h2>
            <div className="w-24 h-1 bg-green-500 mx-auto"></div>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem id="faq-experience" value="item-1" className="border border-gray-200 rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Apakah harus punya pengalaman?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Tidak wajib. Kami menyediakan pelatihan dasar pijat profesional bagi mitra baru.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem id="faq-schedule" value="item-2" className="border border-gray-200 rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Apakah jadwal kerja diatur oleh PijatJogja?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Tidak. Anda bebas menentukan jadwal dan area kerja sendiri.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem id="faq-payment" value="item-3" className="border border-gray-200 rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Bagaimana sistem pembagian hasilnya?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Pembagian hasil transparan dan langsung ditransfer ke rekening setiap minggu.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem id="faq-fee" value="item-4" className="border border-gray-200 rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Apakah ada biaya pendaftaran?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Gratis! Tidak ada biaya bergabung.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem id="faq-requirements" value="item-5" className="border border-gray-200 rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Apa saja persyaratan untuk bergabung?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Anda perlu KTP yang masih berlaku, usia minimal 18 tahun, dan komitmen untuk memberikan layanan terbaik.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Kontak & Bantuan */}
<section id="contact-section" className="py-16 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
  <div className="container mx-auto px-4">
    {(() => {
      // Debug logs
      console.log('🎨 RENDERING Contact Section')
      console.log('📦 contacts state:', contacts)
      console.log('📍 alamat:', getContactByType('alamat'))
      console.log('📱 whatsapp:', getContactByType('whatsapp'))
      console.log('📧 email:', getContactByType('email'))
      
      if (isLoadingContacts) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )
      }
      
      if (contactError) {
        return (
          <div className="text-center text-white/80">
            <p>{contactError}</p>
          </div>
        )
      }
      
      const alamatContact = getContactByType('alamat')
      const waContact = getContactByType('whatsapp')
      const mailContact = getContactByType('email')
      
      // Fungsi untuk membuka WhatsApp dengan pesan otomatis
      const handleOpenChat = () => {
        if (waContact?.value) {
          // Format nomor WhatsApp (hapus karakter non-digit)
          let phoneNumber = waContact.value.replace(/\D/g, '');
          
          // Jika nomor dimulai dengan 0, ganti dengan 62
          if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
          }
          
          // Jika tidak dimulai dengan 62, tambahkan 62
          if (!phoneNumber.startsWith('62')) {
            phoneNumber = '62' + phoneNumber;
          }
          
          // Ambil pesan dari default_message atau defaultMessage (dengan type safety)
          const contactWithMessage = waContact as any;
          const message = contactWithMessage?.default_message || 
                         contactWithMessage?.defaultMessage || 
                         'Halo, saya ingin bertanya lebih lanjut tentang layanan Anda.';
          
          // Encode pesan untuk URL
          const encodedMessage = encodeURIComponent(message);
          
          // Buat URL WhatsApp
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
          
          // Debug log
          console.log('📱 Opening WhatsApp:', {
            originalNumber: waContact.value,
            formattedNumber: phoneNumber,
            message: message,
            url: whatsappUrl
          });
          
          // Buka di tab/window baru
          window.open(whatsappUrl, '_blank');
        } else {
          console.error('❌ Nomor WhatsApp tidak tersedia');
        }
      };
      
      return (
        <>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">📞 Hubungi Kami</h2>
            <p className="text-xl text-white/90">Ingin bertanya lebih lanjut? Tim kami siap membantu Anda.</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Card Alamat */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">
                    {alamatContact?.label || 'Alamat'}
                  </h3>
                  <p className="text-white/80">
                    {alamatContact?.value || 'Jl. Contoh No. 123, Yogyakarta'}
                  </p>
                </CardContent>
              </Card>

              {/* Card WhatsApp */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <Phone className="w-8 h-8 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">
                    {waContact?.label || 'WhatsApp'}
                  </h3>
                  <p className="text-white/80">
                    {waContact?.value || '0812-3456-7890'}
                  </p>
                </CardContent>
              </Card>

              {/* Card Email */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <Mail className="w-8 h-8 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">
                    {mailContact?.label || 'Email'}
                  </h3>
                  <p className="text-white/80">
                    {mailContact?.value || 'info@example.com'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tombol Chat */}
            <div className="text-center">
              <Button 
                id="contact-chat-btn" 
                size="lg" 
                onClick={handleOpenChat}
                disabled={!waContact?.value}
                className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                Chat Admin Sekarang
              </Button>
              {(() => {
                const contactWithMessage = waContact as any;
                return (contactWithMessage?.default_message || contactWithMessage?.defaultMessage) && (
                  <p className="text-sm text-white/70 mt-3">
                    💬 Pesan otomatis akan dikirim
                  </p>
                );
              })()}
            </div>
          </div>
        </>
      )
    })()}
  </div>
</section>
   
      {/* Footer */}
      <footer id="footer-section" className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">PijatJogja</p>
            <p className="text-gray-400">Pijat Profesional, Penghasilan Maksimal</p>
            <p className="text-gray-500 text-sm mt-4">© 2024 PijatJogja. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}