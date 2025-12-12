import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

// Helper function untuk verify auth
async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return { user: null, error: 'No token provided' }
  }

  const { data: { user }, error } = await supabaseServer.auth.getUser(token)

  return { user, error }
}

// GET - Ambil satu content by ID (Requires Auth)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: content, error } = await supabaseServer
      .from('contents')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { success: false, error: 'Content not found' },
          { status: 404 }
        )
      }
      console.error('Supabase query error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch content' },
        { status: 500 }
      )
    }

    // Parse metadata for response
    const processedContent = {
      ...content,
      metadata: content.metadata ? JSON.parse(content.metadata) : null
    }

    return NextResponse.json({
      success: true,
      data: processedContent
    })

  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// PATCH - Update content (Requires Auth)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { key, title, content, type, order, isPublished, metadata } = body

    // Cek content exists
    const { data: existing } = await supabaseServer
      .from('contents')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
      updated_by: user.id // Track who updated
    }

    if (key !== undefined) {
      // Cek duplikat key
      const { data: duplicate } = await supabaseServer
        .from('contents')
        .select('id')
        .eq('key', key)
        .neq('id', params.id)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Key already exists' },
          { status: 400 }
        )
      }
      updates.key = key
    }

    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (type !== undefined) updates.type = type
    if (order !== undefined) updates.order = order
    if (isPublished !== undefined) updates.is_published = isPublished
    if (metadata !== undefined) {
      updates.metadata = metadata ? JSON.stringify(metadata) : null
    }

    if (Object.keys(updates).length === 2) { // Only updated_at and updated_by
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update content
    const { data: updatedContent, error } = await supabaseServer
      .from('contents')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update content' },
        { status: 500 }
      )
    }

    // Parse metadata for response
    const processedContent = {
      ...updatedContent,
      metadata: updatedContent.metadata ? JSON.parse(updatedContent.metadata) : null
    }

    return NextResponse.json({
      success: true,
      data: processedContent,
      message: 'Content updated successfully'
    })

  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus content (Requires Auth)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Cek content exists
    const { data: existing } = await supabaseServer
      .from('contents')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Delete content
    const { error } = await supabaseServer
      .from('contents')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    })

  } catch (error) {
    console.error('Content deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}