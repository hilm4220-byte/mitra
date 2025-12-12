// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE CALLED ===')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)

  try {
    // Parse request body
    let body
    try {
      const text = await request.text()
      console.log('Raw body:', text)
      
      if (!text) {
        console.error('Empty request body')
        return NextResponse.json(
          { 
            success: false,
            error: 'Request body is empty' 
          },
          { status: 400, headers: corsHeaders }
        )
      }

      body = JSON.parse(text)
      console.log('Parsed body:', body)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Support both 'email' and 'username' fields for compatibility
    const email = body.email || body.username
    const password = body.password

    console.log('Body keys:', Object.keys(body))
    console.log('Email field:', body.email)
    console.log('Username field:', body.username)
    console.log('Final email:', email)
    console.log('Password received:', password ? '***' : 'missing')

    // Validasi input
    if (!email || !password) {
      console.error('Missing credentials')
      console.error('Email value:', email)
      console.error('Password value:', password ? 'exists' : 'missing')
      return NextResponse.json(
        { 
          success: false,
          error: 'Email dan password harus diisi' 
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email)
      return NextResponse.json(
        { 
          success: false,
          error: 'Format email tidak valid' 
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json(
        { 
          success: false,
          error: 'Server configuration error: Missing Supabase credentials' 
        },
        { status: 500, headers: corsHeaders }
      )
    }

    // Import Supabase dynamically
    let createClient
    try {
      const supabaseModule = await import('@supabase/supabase-js')
      createClient = supabaseModule.createClient
    } catch (importError) {
      console.error('Failed to import Supabase:', importError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Server error: Supabase not installed. Run: npm install @supabase/supabase-js' 
        },
        { status: 500, headers: corsHeaders }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Attempting Supabase auth for:', email)

    // Login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })

    if (error) {
      console.error('Supabase auth error:', error.message)
      console.error('Error code:', error.status)
      return NextResponse.json(
        { 
          success: false,
          error: 'Email atau password salah',
          details: error.message
        },
        { status: 401, headers: corsHeaders }
      )
    }

    if (!data.user || !data.session) {
      console.error('No user or session in response')
      return NextResponse.json(
        { 
          success: false,
          error: 'Login gagal. Tidak ada sesi yang dibuat.' 
        },
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('User authenticated:', data.user.email)

    // Get user metadata
    const user = data.user
    const userMetadata = user.user_metadata || {}
    const userRole = userMetadata.role || 'user'
    
    console.log('User role:', userRole)

    // Check admin role
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      console.warn(`Access denied for role: ${userRole}`)
      return NextResponse.json(
        { 
          success: false,
          error: 'Anda tidak memiliki akses admin. Role Anda: ' + userRole 
        },
        { status: 403, headers: corsHeaders }
      )
    }

    // Success response
    const response = {
      success: true,
      message: 'Login berhasil',
      token: data.session.access_token,
      admin: {
        id: user.id,
        email: user.email,
        fullName: userMetadata.full_name || userMetadata.name || 'Admin',
        role: userRole,
        avatar: userMetadata.avatar_url || null,
        createdAt: user.created_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
      }
    }

    console.log('=== LOGIN SUCCESS ===')
    console.log('Admin:', response.admin.email, '- Role:', response.admin.role)

    return NextResponse.json(response, { headers: corsHeaders })

  } catch (error) {
    console.error('=== UNEXPECTED ERROR ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Terjadi kesalahan server',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers: corsHeaders }
    )
  }
}