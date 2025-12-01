import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('✅ Dashboard API called')
    
    // Ambil token dari header
    const authHeader = request.headers.get('Authorization')
    console.log('🔑 Auth header:', authHeader)
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No auth header' },
        { status: 401 }
      )
    }

    // Return dummy data untuk test
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRegistrations: 0,
          pendingRegistrations: 0,
          approvedRegistrations: 0,
          rejectedRegistrations: 0,
          totalTherapists: 0,
          activeTherapists: 0,
          inactiveTherapists: 0,
          suspendedTherapists: 0
        },
        recent: {
          registrations: [],
          therapists: []
        },
        monthlyStats: []
      }
    })

  } catch (error: any) {
    console.error('🔥 Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}