// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { user: null, error: 'No token' }
  
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  return { user, error }
}

function calculateMonthlyStats(registrations: any[] = []) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const now = new Date()
  const stats: { month: string; registrations: number; approved: number; rejected: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = `${months[date.getMonth()]} ${date.getFullYear()}`

    const monthRegs = registrations.filter(r => {
      const raw = r?.submitted_at ?? r?.submittedAt ?? r?.created_at ?? r?.createdAt
      if (!raw) return false

      const regDate = new Date(raw)
      if (isNaN(regDate.getTime())) return false

      return (
        regDate.getMonth() === date.getMonth() &&
        regDate.getFullYear() === date.getFullYear()
      )
    })

    const normalize = (val: any) => String(val ?? '').toUpperCase()

    stats.push({
      month: monthName,
      registrations: monthRegs.length,
      approved: monthRegs.filter(r => normalize(r.status) === 'APPROVED').length,
      rejected: monthRegs.filter(r => normalize(r.status) === 'REJECTED').length,
    })
  }

  return stats
}

export async function GET(request: NextRequest) {
  try {
    console.log('✅ Dashboard API called')
    
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      console.log('❌ Unauthorized access')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Query registrations
    const { data: registrations, error: regError } = await supabaseServer
      .from('therapist_registrations')
      // gunakan nama kolom yang sebenarnya di DB: 'submitted_at'
      .select('*')
      .order('submitted_at', { ascending: false })

    if (regError) {
      console.error('❌ Error fetching registrations:', regError)
      throw regError
    }

    // Query therapists
    const { data: therapists, error: therapistError } = await supabaseServer
      .from('therapists')
      .select('*')
      .order('created_at', { ascending: false }) // pastikan therapists punya created_at; ubah kalau berbeda

    if (therapistError) {
      console.error('❌ Error fetching therapists:', therapistError)
      throw therapistError
    }

    console.log('📊 Data fetched - Registrations:', registrations?.length, 'Therapists:', therapists?.length)

    // helper normalize
    const normalize = (v: any) => String(v ?? '').toUpperCase()

    // Calculate overview stats (tangani kemungkinan null)
    const regs = registrations ?? []
    const ths = therapists ?? []

    const overview = {
      totalRegistrations: regs.length,
      pendingRegistrations: regs.filter((r: any) => normalize(r.status) === 'PENDING').length,
      approvedRegistrations: regs.filter((r: any) => normalize(r.status) === 'APPROVED').length,
      rejectedRegistrations: regs.filter((r: any) => normalize(r.status) === 'REJECTED').length,
      totalTherapists: ths.length,
      activeTherapists: ths.filter((t: any) => normalize(t.status) === 'ACTIVE').length,
      inactiveTherapists: ths.filter((t: any) => normalize(t.status) === 'INACTIVE').length,
      suspendedTherapists: ths.filter((t: any) => normalize(t.status) === 'SUSPENDED').length,
    }

    // Recent registrations (last 7 days) — pakai submitted_at
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentRegistrations = regs
      .filter((r: any) => {
        const raw = r?.submitted_at ?? r?.submittedAt ?? r?.created_at ?? r?.createdAt
        if (!raw) return false
        const d = new Date(raw)
        return !isNaN(d.getTime()) && d >= sevenDaysAgo
      })
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        fullName: r.full_name ?? r.fullName,
        whatsapp: r.whatsapp,
        status: r.status,
        submittedAt: r.submitted_at ?? r.submittedAt ?? r.created_at ?? r.createdAt
      }))

    const recentTherapists = ths
      .filter((t: any) => {
        const raw = t?.created_at ?? t?.createdAt ?? t?.joined_at ?? t?.joinedAt
        if (!raw) return false
        const d = new Date(raw)
        return !isNaN(d.getTime()) && d >= sevenDaysAgo
      })
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        fullName: t.full_name ?? t.fullName,
        whatsapp: t.whatsapp,
        status: t.status,
        joinedAt: t.created_at ?? t.createdAt
      }))

    // Monthly stats (last 6 months)
    const monthlyStats = calculateMonthlyStats(regs)

    return NextResponse.json({
      success: true,
      data: {
        overview,
        recent: {
          registrations: recentRegistrations,
          therapists: recentTherapists
        },
        monthlyStats
      }
    })

  } catch (error: any) {
    console.error('🔥 Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
