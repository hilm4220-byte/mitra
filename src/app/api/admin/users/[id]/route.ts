import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { user: null, error: 'No token provided' }
  
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  return { user, error }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, password, full_name, isActive } = body

    const updateData: any = {}

    if (email) updateData.email = email
    if (password) updateData.password = password

    // Update user metadata
    if (full_name) {
      updateData.user_metadata = {
        full_name,
        display_name: full_name
      }
    }

    // Ban/unban user based on isActive
    if (isActive !== undefined) {
      if (isActive === 0) {
        // Ban user (set ban until far future)
        updateData.ban_duration = '876000h' // 100 years
      } else {
        // Unban user
        updateData.ban_duration = 'none'
      }
    }

    const { data, error } = await supabaseServer.auth.admin.updateUserById(
      id,
      updateData
    )

    if (error) {
      console.error('Update user error:', error)
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
        full_name: data.user.user_metadata?.full_name
      },
      message: 'User updated successfully'
    })

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { error } = await supabaseServer.auth.admin.deleteUser(id)

    if (error) {
      console.error('Delete user error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}