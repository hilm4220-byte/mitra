import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

type WebsiteContentRecord = RowDataPacket & {
  id: string
  key: string
  title: string
  subtitle: string | null
  content: string | null
  isActive: number
  createdAt: Date
  updatedAt: Date
}

type ContactRecord = RowDataPacket & {
  id: string
  type: string
  label: string
  value: string
  isActive: number
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: NextRequest) {
  try {
    // Ambil semua konten website yang aktif
    const contents = await db.query<WebsiteContentRecord>(
      `SELECT * FROM website_contents WHERE isActive = 1 ORDER BY \`key\` ASC`
    )

    // Group by key prefix
    const groupedContent: Record<string, any> = {}
    contents.forEach(content => {
      if (content.key.startsWith('benefit_')) {
        if (!groupedContent.benefits) groupedContent.benefits = []
        groupedContent.benefits.push(content)
      } else if (content.key.startsWith('contact_')) {
        if (!groupedContent.contact) groupedContent.contact = []
        groupedContent.contact.push(content)
      } else {
        groupedContent[content.key] = content
      }
    })

    // Ambil kontak info yang aktif
    const contacts = await db.query<ContactRecord>(
      `SELECT * FROM contact_infos WHERE isActive = 1 ORDER BY type ASC`
    )

    return NextResponse.json({
      success: true,
      data: {
        contents: groupedContent,
        contacts: contacts.map((contact) => ({
          ...contact,
          isActive: Boolean(contact.isActive),
        })),
      }
    })

  } catch (error) {
    console.error('Get public content error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}