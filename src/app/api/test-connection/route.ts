// app/api/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set (length: ' + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0) + ')' : '❌ Missing',
    },
    tests: {} as any
  }

  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.auth.getSession()
    results.tests.connection = {
      status: error ? '⚠️ Warning' : '✅ Success',
      message: error ? error.message : 'Connection successful',
      hasSession: !!data.session
    }
  } catch (error) {
    results.tests.connection = {
      status: '❌ Failed',
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // Test 2: Auth endpoint
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'dummy@test.com',
      password: 'wrongpassword',
    })

    results.tests.auth = {
      status: error ? (error.message.includes('Invalid login') ? '✅ Working' : '⚠️ Unexpected') : '⚠️ Unexpected Success',
      message: error ? error.message : 'Auth succeeded with dummy credentials (unexpected)',
      note: 'Invalid credentials error is expected and means auth is working'
    }
  } catch (error) {
    results.tests.auth = {
      status: '❌ Failed',
      error: error instanceof Error ? error.message : String(error)
    }
  }

  // Overall status
  const allPassed = results.tests.connection?.status?.includes('✅') && 
                    results.tests.auth?.status?.includes('✅')

  return NextResponse.json({
    success: allPassed,
    message: allPassed ? 'All tests passed' : 'Some tests failed or returned warnings',
    ...results
  })
}

// Test login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email and password required for test',
          hint: 'POST { "email": "your@email.com", "password": "yourpassword" }'
        },
        { status: 400 }
      )
    }

    console.log('Testing login with email:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          email: email,
          errorCode: error.status,
          errorName: error.name
        }
      })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({
        success: false,
        error: 'No user or session returned',
        details: {
          hasUser: !!data.user,
          hasSession: !!data.session
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Login test successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        metadata: data.user.user_metadata,
        role: data.user.user_metadata?.role || 'not set'
      },
      session: {
        hasAccessToken: !!data.session.access_token,
        hasRefreshToken: !!data.session.refresh_token,
        expiresIn: data.session.expires_in
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}