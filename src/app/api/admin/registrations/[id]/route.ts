import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'crypto'

// Middleware sederhana untuk validasi admin token
type AdminRecord = RowDataPacket & {
  id: string
  isActive: number
}

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

type RegistrationWithTherapist = RowDataPacket & {
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
  therapistId: string | null
  therapistStatus: string | null
  therapistJoinedAt: Date | null
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n=== START PATCH REGISTRATION ===')
  
  try {
    // Await params first (Next.js 15 requirement)
    const { id: registrationId } = await params
    console.log('   Registration ID:', registrationId)

    const adminId = validateAdminToken(request)
    if (!adminId) {
      console.log('   ✗ Unauthorized - no token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('   ✓ Admin ID:', adminId)

    // Verifikasi admin exists
    const admin = await db.queryOne<AdminRecord>(
      `SELECT id FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
      [adminId]
    )

    if (!admin) {
      console.log('   ✗ Admin not found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('   ✓ Admin verified')

    const body = await request.json()
    const { action, notes } = body

    console.log('   Registration ID:', registrationId)
    console.log('   Action:', action)
    console.log('   Notes:', notes ? 'YES' : 'NO')

    // UPDATED: Terima APPROVE, REJECT, dan PENDING
    if (!action || !['APPROVE', 'REJECT', 'PENDING'].includes(action)) {
      console.log('   ✗ Invalid action:', action)
      return NextResponse.json(
        { error: `Action harus APPROVE, REJECT, atau PENDING. Diterima: ${action}` },
        { status: 400 }
      )
    }
    console.log('   ✓ Action valid')

    // Ambil data pendaftaran
    const registration = await db.queryOne<RegistrationRecord>(
      `SELECT * FROM therapist_registrations WHERE id = ? LIMIT 1`,
      [registrationId]
    )

    if (!registration) {
      console.log('   ✗ Registration not found')
      return NextResponse.json(
        { error: 'Data pendaftaran tidak ditemukan' },
        { status: 404 }
      )
    }
    console.log('   ✓ Registration found, current status:', registration.status)

    // Map action ke status
    const statusMap: Record<string, string> = {
      'APPROVE': 'APPROVED',
      'REJECT': 'REJECTED',
      'PENDING': 'PENDING'
    }
    const newStatus = statusMap[action]
    const now = new Date()

    console.log('   Updating to status:', newStatus)

    await db.transaction(async (connection) => {
      // Update status dengan atau tanpa notes
      if (notes) {
        await connection.execute(
          `UPDATE therapist_registrations SET status = ?, notes = ?, updatedAt = ? WHERE id = ?`,
          [newStatus, notes, now, registrationId]
        )
      } else {
        await connection.execute(
          `UPDATE therapist_registrations SET status = ?, updatedAt = ? WHERE id = ?`,
          [newStatus, now, registrationId]
        )
      }

      // Jika APPROVE, buat therapist account
      if (action === 'APPROVE') {
        console.log('   Creating therapist account...')
        
        // Cek apakah sudah ada therapist
        const existingTherapist = await connection.execute(
          'SELECT id FROM therapists WHERE registrationId = ? LIMIT 1',
          [registrationId]
        )

        if (existingTherapist[0] && Array.isArray(existingTherapist[0]) && existingTherapist[0].length === 0) {
          await connection.execute(
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
              randomUUID(),
              registration.id,
              registration.fullName,
              registration.whatsapp,
              registration.address,
              registration.gender,
              registration.experience,
              registration.workArea,
              registration.availability,
              registration.message,
              'ACTIVE',
              now,
              now,
            ]
          )
          console.log('   ✓ Therapist created')
        } else {
          console.log('   ℹ Therapist already exists')
        }
      }
    })

    console.log('   ✓ Transaction completed')

    const updatedRegistration = await db.queryOne<RegistrationRecord>(
      `SELECT * FROM therapist_registrations WHERE id = ? LIMIT 1`,
      [registrationId]
    )

    console.log('=== END PATCH REGISTRATION (SUCCESS) ===\n')

    return NextResponse.json({
      success: true,
      message: `Pendaftaran berhasil ${action === 'APPROVE' ? 'disetujui' : action === 'REJECT' ? 'ditolak' : 'diubah'}`,
      data: updatedRegistration
    })

  } catch (error) {
    console.error('\n=== ERROR PATCH REGISTRATION ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('=== END ERROR ===\n')
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses pendaftaran' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = validateAdminToken(request)
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const registration = await db.queryOne<RegistrationWithTherapist>(
      `SELECT tr.*, t.id AS therapistId, t.status AS therapistStatus, t.joinedAt AS therapistJoinedAt
       FROM therapist_registrations tr
       LEFT JOIN therapists t ON t.registrationId = tr.id
       WHERE tr.id = ?
       LIMIT 1`,
      [params.id]
    )

    if (!registration) {
      return NextResponse.json(
        { error: 'Data pendaftaran tidak ditemukan' },
        { status: 404 }
      )
    }

    const normalizedRegistration = {
      id: registration.id,
      fullName: registration.fullName,
      whatsapp: registration.whatsapp,
      address: registration.address,
      gender: registration.gender,
      experience: registration.experience,
      workArea: registration.workArea,
      availability: registration.availability,
      message: registration.message,
      status: registration.status,
      submittedAt: registration.submittedAt,
      updatedAt: registration.updatedAt,
      therapist: registration.therapistId
        ? {
            id: registration.therapistId,
            status: registration.therapistStatus,
            joinedAt: registration.therapistJoinedAt,
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      data: normalizedRegistration
    })

  } catch (error) {
    console.error('Get registration error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}