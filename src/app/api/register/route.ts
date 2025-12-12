import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      whatsapp,
      address,
      gender,
      experience,
      workArea,
      availability,
      message
    } = body

    // Validasi input
    if (!fullName || !whatsapp || !address || !gender || !experience || !workArea || !availability) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi kecuali pesan tambahan' },
        { status: 400 }
      )
    }

    // Validasi format WhatsApp
    const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '')
    const whatsappRegex = /^08[0-9]{8,12}$/
    if (!whatsappRegex.test(cleanWhatsapp)) {
      return NextResponse.json(
        { error: 'Format nomor WhatsApp tidak valid. Gunakan format 08xx-xxxx-xxxx' },
        { status: 400 }
      )
    }

    const now = new Date()
    const registrationId = randomUUID()

    // ========================
    // INSERT DENGAN NAMA KOLOM BENAR
    // ========================
    const { error: insertError } = await supabase
      .from('therapist_registrations')
      .insert({
        id: registrationId,
        full_name: fullName,
        whatsapp: cleanWhatsapp,
        address,
        gender,
        experience,
        work_area: workArea,
        availability,
        message: message || null,
        status: 'PENDING',
        submitted_at: now.toISOString(),
        updated_at: now.toISOString()
      })

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil dikirim! Tim kami akan menghubungi Anda dalam 1x24 jam.',
      registrationId
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses pendaftaran. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // ============================
    // TABEL BENAR + KOLUMN BENAR
    // ============================
    const { data, error } = await supabase
      .from('therapist_registrations')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({
      success: true,
      registrations: data
    })

  } catch (error) {
    console.error('Fetch registrations error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data pendaftaran' },
      { status: 500 }
    )
  }
}
