import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

// Middleware sederhana untuk validasi admin token
type AdminRecord = RowDataPacket & {
  id: string
  isActive: number
}

type TherapistRecord = RowDataPacket & {
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

    const { status, ...updateData } = await request.json()
    const therapistId = params.id

    // Validasi status
    if (status && !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    // Cek therapist exists
    const existingTherapist = await db.queryOne<TherapistRecord>(
      `SELECT * FROM therapists WHERE id = ? LIMIT 1`,
      [therapistId]
    )

    if (!existingTherapist) {
      return NextResponse.json(
        { error: 'Terapis tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update therapist
    const allowedFields = [
      'fullName',
      'whatsapp',
      'address',
      'gender',
      'experience',
      'workArea',
      'availability',
      'message',
    ] as const

    const updates: string[] = []
    const params: any[] = []

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        updates.push(`${field} = ?`)
        params.push((updateData as Record<string, any>)[field])
      }
    }

    if (status) {
      updates.push(`status = ?`)
      params.push(status)
    }

    const now = new Date()
    updates.push('updatedAt = ?')
    params.push(now)

    await db.execute(
      `UPDATE therapists SET ${updates.join(', ')} WHERE id = ?`,
      [...params, therapistId]
    )

    const updatedTherapist = await db.queryOne<TherapistRecord>(
      `SELECT * FROM therapists WHERE id = ? LIMIT 1`,
      [therapistId]
    )

    return NextResponse.json({
      success: true,
      message: 'Data terapis berhasil diperbarui',
      data: updatedTherapist
    })

  } catch (error) {
    console.error('Update therapist error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui data terapis' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const therapistId = params.id

    // Cek therapist exists
    const existingTherapist = await db.queryOne<TherapistRecord>(
      `SELECT id FROM therapists WHERE id = ? LIMIT 1`,
      [therapistId]
    )

    if (!existingTherapist) {
      return NextResponse.json(
        { error: 'Terapis tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete therapist
    await db.execute(`DELETE FROM therapists WHERE id = ?`, [therapistId])

    return NextResponse.json({
      success: true,
      message: 'Terapis berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete therapist error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus terapis' },
      { status: 500 }
    )
  }
}