import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'crypto'

// Middleware sederhana untuk validasi admin token
type AdminRecord = RowDataPacket & {
  id: string
  isActive: number
}

type TherapistRow = RowDataPacket & {
  id: string
  registrationId: string
  fullName: string
  whatsapp: string
  address: string
  gender: string
  experience: string
  workArea: string
  availability: string
  message: string | null
  status: string
  joinedAt: Date
  updatedAt: Date
  registrationSubmittedAt: Date | null
  registrationMessage: string | null
}

type TherapistWithRegistration = RowDataPacket & {
  id: string
  registrationId: string
  fullName: string
  whatsapp: string
  address: string
  gender: string
  experience: string
  workArea: string
  availability: string
  message: string | null
  status: string
  joinedAt: Date
  updatedAt: Date
  registrationSubmittedAt: Date | null
  registrationMessage: string | null
}

type CountRow = RowDataPacket & {
  total: number
}

function validateAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [adminId] = decoded.split(':')
    return adminId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminId = validateAdminToken(request)
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verifikasi admin exists
    const admin = await db.queryOne<AdminRecord>(
      `SELECT id, isActive FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
      [adminId]
    )

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ambil data terapis dengan pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    const filters: string[] = []
    const filterParams: any[] = []

    if (status) {
      filters.push('t.status = ?')
      filterParams.push(status)
    }

    if (search) {
      filters.push('(t.fullName LIKE ? OR t.whatsapp LIKE ? OR t.address LIKE ?)')
      const likeValue = `%${search}%`
      filterParams.push(likeValue, likeValue, likeValue)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const therapists = await db.query<TherapistRow>(
      `SELECT t.*, tr.submittedAt AS registrationSubmittedAt, tr.message AS registrationMessage
       FROM therapists t
       LEFT JOIN therapist_registrations tr ON tr.id = t.registrationId
       ${whereClause}
       ORDER BY t.joinedAt DESC
       LIMIT ? OFFSET ?`,
      [...filterParams, limit, skip]
    )

    const countRow = await db.queryOne<CountRow>(
      `SELECT COUNT(*) AS total FROM therapists t
       ${whereClause}`,
      filterParams
    )

    return NextResponse.json({
      success: true,
      data: therapists.map((therapist) => ({
        id: therapist.id,
        registrationId: therapist.registrationId,
        fullName: therapist.fullName,
        whatsapp: therapist.whatsapp,
        address: therapist.address,
        gender: therapist.gender,
        experience: therapist.experience,
        workArea: therapist.workArea,
        availability: therapist.availability,
        message: therapist.message,
        status: therapist.status,
        joinedAt: therapist.joinedAt,
        updatedAt: therapist.updatedAt,
        registration: therapist.registrationSubmittedAt
          ? {
              submittedAt: therapist.registrationSubmittedAt,
              message: therapist.registrationMessage,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total: countRow?.total ?? 0,
        pages: Math.ceil((countRow?.total ?? 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get therapists error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = validateAdminToken(request)
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verifikasi admin exists
    const admin = await db.queryOne<AdminRecord>(
      `SELECT id FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
      [adminId]
    )

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const therapistData = await request.json()

    // Validasi required fields
    const requiredFields = ['fullName', 'whatsapp', 'address', 'gender', 'experience', 'workArea', 'availability']
    for (const field of requiredFields) {
      if (!therapistData[field]) {
        return NextResponse.json(
          { error: `Field ${field} harus diisi` },
          { status: 400 }
        )
      }
    }

    // Cek duplikasi WhatsApp
    const existingTherapist = await db.queryOne<RowDataPacket & { id: string }>(
      `SELECT id FROM therapists WHERE whatsapp = ? LIMIT 1`,
      [therapistData.whatsapp]
    )

    if (existingTherapist) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp sudah terdaftar' },
        { status: 400 }
      )
    }

    // Buat therapist baru
    const therapistId = randomUUID()
    const registrationId = therapistData.registrationId || `manual_${Date.now()}`
    const now = new Date()

    await db.execute(
      `INSERT INTO therapists (
        id,
        registrationId,
        fullName,
        whatsapp,
        address,
        gender,
        experience,
        workArea,
        availability,
        message,
        status,
        joinedAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        therapistId,
        registrationId,
        therapistData.fullName,
        therapistData.whatsapp,
        therapistData.address,
        therapistData.gender,
        therapistData.experience,
        therapistData.workArea,
        therapistData.availability,
        therapistData.message ?? null,
        therapistData.status || 'ACTIVE',
        now,
        now,
      ]
    )

    const therapist = await db.queryOne<TherapistWithRegistration>(
      `SELECT t.*, tr.submittedAt AS registrationSubmittedAt, tr.message AS registrationMessage
       FROM therapists t
       LEFT JOIN therapist_registrations tr ON tr.id = t.registrationId
       WHERE t.id = ?
       LIMIT 1`,
      [therapistId]
    )

    return NextResponse.json({
      success: true,
      message: 'Terapis berhasil ditambahkan',
      data: therapist
    })

  } catch (error) {
    console.error('Create therapist error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menambah terapis' },
      { status: 500 }
    )
  }
}