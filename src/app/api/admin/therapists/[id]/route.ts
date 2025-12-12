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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await validateAdminToken(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status, ...updateData } = await request.json()
    const therapistId = params.id

    // Validasi status
    if (status && !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    // Cek therapist exists
    const { data: existingTherapist, error: fetchError } = await supabaseServer
      .from('therapists')
      .select('*')
      .eq('id', therapistId)
      .single()

    if (fetchError || !existingTherapist) {
      return NextResponse.json(
        { error: 'Terapis tidak ditemukan' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Map field names to database columns
    const fieldMapping: Record<string, string> = {
      fullName: 'full_name',
      whatsapp: 'whatsapp',
      address: 'address',
      gender: 'gender',
      experience: 'experience',
      workArea: 'work_area',
      availability: 'availability',
      message: 'message'
    }

    for (const [field, dbField] of Object.entries(fieldMapping)) {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        updates[dbField] = (updateData as Record<string, any>)[field]
      }
    }

    if (status) {
      updates.status = status
    }

    // Update therapist
    const { data: updatedTherapist, error: updateError } = await supabaseServer
      .from('therapists')
      .update(updates)
      .eq('id', therapistId)
      .select()
      .single()

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json(
        { error: 'Terjadi kesalahan saat memperbarui data terapis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data terapis berhasil diperbarui',
      data: updatedTherapist
    })

  } catch (error) {
    console.error('Update therapist error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui data terapis' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await validateAdminToken(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const therapistId = params.id

    // Cek therapist exists
    const { data: existingTherapist, error: fetchError } = await supabaseServer
      .from('therapists')
      .select('id')
      .eq('id', therapistId)
      .single()

    if (fetchError || !existingTherapist) {
      return NextResponse.json(
        { error: 'Terapis tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete therapist
    const { error: deleteError } = await supabaseServer
      .from('therapists')
      .delete()
      .eq('id', therapistId)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return NextResponse.json(
        { error: 'Terjadi kesalahan saat menghapus terapis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Terapis berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete therapist error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus terapis' },
      { status: 500 }
    )
  }
}
