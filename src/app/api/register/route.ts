import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'crypto'

type RegistrationRecord = RowDataPacket & {
  id: string
  fullName: string
  whatsapp: string
  address: string
  gender: string
  experience: string
  workArea: string
  availability: string
  message: string | null
  status: string
  submittedAt: Date
  updatedAt: Date
}

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
    const whatsappRegex = /^08[0-9]{8,12}$/
    const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '')
    if (!whatsappRegex.test(cleanWhatsapp)) {
      return NextResponse.json(
        { error: 'Format nomor WhatsApp tidak valid. Gunakan format 08xx-xxxx-xxxx' },
        { status: 400 }
      )
    }

    // Simpan ke database
    const now = new Date()
    const registrationId = randomUUID()

    await db.execute(
      `INSERT INTO therapist_registrations (
        id,
        fullName,
        whatsapp,
        address,
        gender,
        experience,
        workArea,
        availability,
        message,
        status,
        submittedAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registrationId,
        fullName,
        cleanWhatsapp,
        address,
        gender,
        experience,
        workArea,
        availability,
        message || null,
        'PENDING',
        now,
        now,
      ]
    )

    // TODO: Kirim notifikasi ke admin
    // TODO: Kirim konfirmasi WhatsApp ke calon mitra

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
    const registrations = await db.query<RegistrationRecord>(
      `SELECT * FROM therapist_registrations
       ORDER BY submittedAt DESC
       LIMIT 50`
    )

    return NextResponse.json({
      success: true,
      registrations
    })

  } catch (error) {
    console.error('Fetch registrations error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data pendaftaran' },
      { status: 500 }
    )
  }
}