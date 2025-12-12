// File: app/api/contact/route.ts
// API PUBLIC untuk mengambil data contact (tanpa login)

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type ContactRecord = {
  id: string
  type: string
  label: string
  value: string
  defaultMessage?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// GET - Ambil data kontak (PUBLIC)
export async function GET() {
  try {
    const { data: contacts, error } = await supabase
      .from('contact_infos')
      .select('id, type, label, value, default_message, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('type', { ascending: true })

    if (error) throw error

    // Convert snake_case → camelCase
    const formatted: ContactRecord[] = contacts.map(c => ({
      id: c.id,
      type: c.type,
      label: c.label,
      value: c.value,
      defaultMessage: c.default_message,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }))

    return NextResponse.json({
      success: true,
      data: formatted
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
