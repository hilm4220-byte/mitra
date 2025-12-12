import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// =====================
// VALIDATE ADMIN TOKEN
// =====================
async function validateAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)

  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  if (error || !user) return null

  const role = user.user_metadata?.role || 'user'
  if (role !== 'admin' && role !== 'superadmin') return null

  return user
}

// =====================
// GET THERAPISTS
// =====================
export async function GET(request: NextRequest) {
  console.log('\n=== GET THERAPISTS (SUPABASE) ===')

  const user = await validateAdminToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  console.log('Admin validated:', user.email)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  console.log('Query params:', { page, limit, status, search })

  const from = (page - 1) * limit
  const to = from + limit - 1

  // === Build Supabase query (TANPA JOIN dulu untuk testing) ===
  let query = supabaseServer
    .from('therapists')
    .select('*', { count: 'exact' })
    .order('joined_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') {
    query = query.eq('status', status.toUpperCase())
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,` +
      `whatsapp.ilike.%${search}%,` +
      `address.ilike.%${search}%`
    )
  }

  const { data: therapists, error, count } = await query

  if (error) {
    console.error('Supabase query error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data: ' + error.message },
      { status: 500 }
    )
  }

  console.log('Found therapists:', therapists?.length || 0)

  // === Normalize output (snake_case ke camelCase) ===
  const normalized = (therapists || []).map((t: any) => ({
    id: t.id,
    registrationId: t.registration_id,
    fullName: t.full_name,
    whatsapp: t.whatsapp,
    address: t.address,
    gender: t.gender,
    experience: t.experience,
    workArea: t.work_area,
    availability: t.availability,
    message: t.message,
    status: t.status,
    joinedAt: t.joined_at,
    updatedAt: t.updated_at,
  }))

  return NextResponse.json({
    success: true,
    data: normalized,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  })
}


// ===========================
// POST — ADD THERAPIST
// ===========================
export async function POST(request: NextRequest) {
  try {
    const user = await validateAdminToken(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const required = ['fullName','whatsapp','address','gender','experience','workArea','availability']
    for (const f of required) {
      if (!body[f]) {
        return NextResponse.json({ error: `Field ${f} harus diisi` }, { status: 400 })
      }
    }

    const therapistId = randomUUID()
    const now = new Date()

    const { error } = await supabaseServer
      .from('therapists')
      .insert({
        id: therapistId,
        registration_id: body.registrationId || `manual_${Date.now()}`,
        full_name: body.fullName,
        whatsapp: body.whatsapp,
        address: body.address,
        gender: body.gender,
        experience: body.experience,
        work_area: body.workArea,
        availability: body.availability,
        message: body.message || null,
        status: body.status || 'ACTIVE',
        joined_at: now.toISOString(),
        updated_at: now.toISOString()
      })

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Terapis berhasil ditambahkan'
    })

  } catch (err) {
    console.error('Create therapist error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}