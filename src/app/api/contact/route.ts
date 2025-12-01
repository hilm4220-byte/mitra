// File: app/api/contact/route.ts
// API PUBLIC untuk mengambil data contact (tanpa perlu login admin)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

type ContactRecord = RowDataPacket & {
  id: string
  type: string
  label: string
  value: string
  default_message?: string
  isActive: number
  createdAt: Date
  updatedAt: Date
}

// GET - Ambil data kontak (PUBLIC - untuk widget chat dan section Hubungi Kami)
export async function GET() {
  try {
    // Query data kontak yang aktif dengan default_message
    const contacts = await db.query<ContactRecord>(
      `SELECT id, type, label, value, default_message, isActive, createdAt, updatedAt 
       FROM contact_infos 
       WHERE isActive = 1 
       ORDER BY FIELD(type, 'address', 'whatsapp', 'email')`
    )

    return NextResponse.json({
      success: true,
      data: contacts
    })

  } catch (error) {
    console.error('Get contacts error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Terjadi kesalahan saat mengambil data' 
      },
      { status: 500 }
    )
  }
}