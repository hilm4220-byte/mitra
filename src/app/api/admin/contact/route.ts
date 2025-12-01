// File: app/api/admin/contact/route.ts
// UPDATE DARI KODE ANDA YANG SUDAH ADA

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

type AdminRecord = RowDataPacket & {
  id: string
  isActive: number
}

type ContactRecord = RowDataPacket & {
  id: string
  type: string
  label: string
  value: string
  default_message?: string  // TAMBAHAN BARU
  isActive: number
  createdAt: Date
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

// GET - Ambil data kontak (PUBLIC atau ADMIN)
export async function GET(request: NextRequest) {
  try {
    const adminId = validateAdminToken(request)
    
    // Jika ada token admin, validasi admin
    if (adminId) {
      const admin = await db.queryOne<AdminRecord>(
        `SELECT id FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
        [adminId]
      )

      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Query data kontak dengan default_message (UPDATED)
    const contacts = await db.query<ContactRecord>(
      `SELECT id, type, label, value, default_message, isActive, createdAt, updatedAt 
       FROM contact_infos 
       WHERE isActive = 1 
       ORDER BY type`
    )

    return NextResponse.json({
      success: true,
      data: contacts
    })

  } catch (error) {
    console.error('Get contacts error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}

// PUT - Update data kontak (ADMIN ONLY)
export async function PUT(request: NextRequest) {
  try {
    const adminId = validateAdminToken(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await db.queryOne<AdminRecord>(
      `SELECT id FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
      [adminId]
    )

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contacts } = await request.json()

    if (!Array.isArray(contacts)) {
      return NextResponse.json(
        { error: 'Format data tidak valid' },
        { status: 400 }
      )
    }

    // Update setiap contact dengan default_message (UPDATED)
    await db.transaction(async (connection) => {
      for (const contact of contacts) {
        await connection.execute(
          `UPDATE contact_infos 
           SET label = ?, 
               value = ?, 
               default_message = ?,
               updatedAt = NOW() 
           WHERE type = ?`,
          [
            contact.label, 
            contact.value, 
            contact.default_message || null,  // Handle null jika kosong
            contact.type
          ]
        )
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Informasi kontak berhasil diperbarui'
    })

  } catch (error) {
    console.error('Update contacts error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan data' },
      { status: 500 }
    )
  }
}