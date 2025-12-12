// app/api/admin/registrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

async function validateAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const { data, error } = await supabaseServer.auth.getUser(token)

  if (error || !data?.user) return null

  const role = data.user.user_metadata?.role || 'user'
  if (role !== 'admin' && role !== 'superadmin') return null

  return data.user
}

export async function GET(request: NextRequest) {
  try {
    const user = await validateAdminToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 10)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Query tanpa join dulu untuk testing
    let query = supabaseServer
      .from('therapist_registrations')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(from, to)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,` +
        `whatsapp.ilike.%${search}%,` +
        `address.ilike.%${search}%`
      )
    }

    const { data: rows, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data: ' + error.message },
        { status: 500 }
      )
    }

    // Mapping sesuai nama kolom database (snake_case) ke frontend (camelCase)
    const mapped = (rows || []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      whatsapp: r.whatsapp,
      address: r.address,
      gender: r.gender,
      experience: r.experience,
      workArea: r.work_area,
      availability: r.availability,
      message: r.message,
      status: r.status,
      submittedAt: r.submitted_at,
      updatedAt: r.updated_at,
    }))

    return NextResponse.json({
      success: true,
      data: mapped,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (err: any) {
    console.error('Server error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan server',
        details: err?.message
      },
      { status: 500 }
    )
  }
}