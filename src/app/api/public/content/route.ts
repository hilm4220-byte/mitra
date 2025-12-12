import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type WebsiteContentRecord = {
  id: string
  key: string
  title: string
  subtitle: string | null
  content: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type ContactRecord = {
  id: string
  type: string
  label: string
  value: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  try {
    // Ambil semua konten website yang aktif dari table contents
    const { data: contents, error: contentsError } = await supabase
      .from('contents')
      .select('*')
      .eq('is_published', true)
      .order('key', { ascending: true })

    if (contentsError) throw contentsError

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
    const { data: contacts, error: contactsError } = await supabase
      .from('contact_infos')
      .select('*')
      .eq('isactive', true)
      .order('type', { ascending: true })

    if (contactsError) throw contactsError

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