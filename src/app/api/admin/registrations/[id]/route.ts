// app/api/admin/registrations/[id]/route.ts
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
    
    if (error || !user) return null
    
    const userRole = user.user_metadata?.role || 'user'
    
    if (userRole !== 'admin' && userRole !== 'superadmin') return null
    
    return user
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateAdminToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const { data: registration, error } = await supabaseServer
      .from('therapist_registrations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Data tidak ditemukan' },
        { status: 404 }
      )
    }

    // Mapping dari snake_case ke camelCase
    const normalized = {
      id: registration.id,
      fullName: registration.full_name,
      whatsapp: registration.whatsapp,
      address: registration.address,
      gender: registration.gender,
      experience: registration.experience,
      workArea: registration.work_area,
      availability: registration.availability,
      message: registration.message,
      status: registration.status,
      submittedAt: registration.submitted_at,
      updatedAt: registration.updated_at,
    }

    return NextResponse.json({
      success: true,
      data: normalized
    })

  } catch (error: any) {
    console.error('GET registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('\n=== PATCH REGISTRATION (SUPABASE) ===')
  
  try {
    const user = await validateAdminToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { action, notes } = body

    console.log('Registration ID:', id)
    console.log('Action:', action)
    console.log('Notes:', notes ? 'YES' : 'NO')

    // Validasi action
    if (!action || !['APPROVE', 'REJECT', 'PENDING'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action tidak valid' },
        { status: 400 }
      )
    }

    // Map action ke status
    const statusMap: Record<string, string> = {
      'APPROVE': 'APPROVED',
      'REJECT': 'REJECTED',
      'PENDING': 'PENDING'
    }
    const newStatus = statusMap[action]

    // Get existing registration
    const { data: existingReg, error: fetchError } = await supabaseServer
      .from('therapist_registrations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingReg) {
      console.error('Registration not found:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('Current status:', existingReg.status)

    // Update registration status - PAKAI SNAKE_CASE!
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString() // ✅ FIXED: snake_case
    }

    if (notes) {
      updateData.notes = notes
    }

    const { error: updateError } = await supabaseServer
      .from('therapist_registrations')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Gagal mengubah status: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Status updated to:', newStatus)

    // Jika APPROVED, buat therapist account
    if (action === 'APPROVE') {
      console.log('Creating therapist account...')
      
      // Check if therapist already exists
      const { data: existingTherapist } = await supabaseServer
        .from('therapists')
        .select('id')
        .eq('registration_id', id) // ✅ FIXED: snake_case
        .single()

      if (!existingTherapist) {
        // INSERT dengan snake_case sesuai database
        const { error: insertError } = await supabaseServer
          .from('therapists')
          .insert({
            registration_id: id,                    // ✅ snake_case
            full_name: existingReg.full_name,       // ✅ snake_case
            whatsapp: existingReg.whatsapp,
            address: existingReg.address,
            gender: existingReg.gender,
            experience: existingReg.experience,
            work_area: existingReg.work_area,       // ✅ snake_case
            availability: existingReg.availability,
            message: existingReg.message,
            status: 'ACTIVE',
            joined_at: new Date().toISOString(),    // ✅ snake_case
            updated_at: new Date().toISOString()    // ✅ snake_case
          })

        if (insertError) {
          console.error('Failed to create therapist:', insertError)
          // Tidak return error, karena update status sudah berhasil
        } else {
          console.log('Therapist created successfully')
        }
      } else {
        console.log('Therapist already exists')
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pendaftaran berhasil ${action === 'APPROVE' ? 'disetujui' : action === 'REJECT' ? 'ditolak' : 'diubah'}`,
      data: {
        id: id,
        status: newStatus
      }
    })

  } catch (error: any) {
    console.error('PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan: ' + error.message },
      { status: 500 }
    )
  }
}