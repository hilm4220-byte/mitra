import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

async function validateAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)

    if (error || !user) {
      console.error('Token validation error:', error)
      return null
    }

    const userRole = user.user_metadata?.role || 'user'

    if (userRole !== 'admin' && userRole !== 'superadmin') {
      console.warn('User does not have admin role:', userRole)
      return null
    }

    return user
  } catch (error) {
    console.error('Token validation exception:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await validateAdminToken(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ambil semua WhatsApp templates dari Supabase
    const { data: templates, error } = await supabaseServer
      .from('whatsapp_templates')
      .select('*')
      .order('type', { ascending: true })

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json(
        { error: 'Terjadi kesalahan saat mengambil data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: (templates || []).map((template) => ({
        ...template,
        isActive: Boolean(template.isactive),
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
    const adminUser = await validateAdminToken(request)
    if (!adminUser) {
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

    // Update multiple templates with Supabase
    const now = new Date().toISOString()

    const updatePromises = templates.map(async (template: any) => {
      const { error } = await supabaseServer
        .from('whatsapp_templates')
        .update({
          title: template.title,
          message: template.message,
          isactive: template.isActive !== undefined ? Number(template.isActive) : 1,
          updatedat: now
        })
        .eq('type', template.type)

      if (error) {
        console.error(`Error updating template ${template.type}:`, error)
        throw error
      }

      return {
        type: template.type,
        title: template.title,
        message: template.message,
        isActive: template.isActive !== undefined ? Boolean(template.isActive) : true,
        updatedAt: now,
      }
    })

    const updatedTemplates = await Promise.all(updatePromises)

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
