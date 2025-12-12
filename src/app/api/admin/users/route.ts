import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { user: null, error: 'No token provided' }
  
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  return { user, error }
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: { users }, error } = await supabaseServer.auth.admin.listUsers()

    if (error) {
      console.error('List users error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Format sesuai interface lama
    const formattedUsers = users.map(u => ({
      id: u.id,
      username: u.email?.split('@')[0] || 'user',
      email: u.email,
      full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || '',
      role: 'superadmin',
      isActive: u.banned_until ? 0 : 1,
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at
    }))

    return NextResponse.json({
      success: true,
      data: formattedUsers
    })

  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new admin user
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, password, full_name } = body

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and full_name are required' },
        { status: 400 }
      )
    }

    // Create user via Supabase Auth Admin
    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        display_name: full_name
      }
    })

    if (error) {
      console.error('Create user error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.user.id,
        email: data.user.email,
        full_name: full_name
      },
      message: 'User created successfully'
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}