import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

// Middleware sederhana untuk validasi admin token
type AdminRecord = RowDataPacket & {
  id: string
  isActive: number
}

type WhatsappTemplateRecord = RowDataPacket & {
  id: string
  type: string
  title: string
  message: string
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
      `SELECT id FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
      [adminId]
    )

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ambil semua WhatsApp templates
    const templates = await db.query<WhatsappTemplateRecord>(
      `SELECT * FROM whatsapp_templates ORDER BY type ASC`
    )

    return NextResponse.json({
      success: true,
      data: templates.map((template) => ({
        ...template,
        isActive: Boolean(template.isActive),
      }))
    })

  } catch (error) {
    console.error('Get WhatsApp templates error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { templates } = await request.json()

    if (!Array.isArray(templates)) {
      return NextResponse.json(
        { error: 'Data harus berupa array' },
        { status: 400 }
      )
    }

    // Update multiple templates
    const now = new Date()

    const updatedTemplates = await Promise.all(
      templates.map(async (template: any) => {
        await db.execute(
          `UPDATE whatsapp_templates
           SET title = ?, message = ?, isActive = ?, updatedAt = ?
           WHERE type = ?`,
          [
            template.title,
            template.message,
            template.isActive !== undefined ? Number(template.isActive) : 1,
            now,
            template.type,
          ]
        )

        return {
          type: template.type,
          title: template.title,
          message: template.message,
          isActive: template.isActive !== undefined ? Boolean(template.isActive) : true,
          updatedAt: now,
        }
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Template WhatsApp berhasil diperbarui',
      data: updatedTemplates
    })

  } catch (error) {
    console.error('Update WhatsApp templates error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui template' },
      { status: 500 }
    )
  }
}