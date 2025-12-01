import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

interface Content extends RowDataPacket {
  id: string
  key: string
  title: string
  content: string
  type: string
  order: number
  is_published: boolean
  metadata: any
  created_at: Date
  updated_at: Date
}

// GET - Ambil satu content by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [rows] = await db.pool.execute<Content[]>(
      'SELECT * FROM contents WHERE id = ?',
      [params.id]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    const content = {
      ...rows[0],
      metadata: rows[0].metadata ? JSON.parse(rows[0].metadata as any) : null
    }

    return NextResponse.json({
      success: true,
      data: content
    })

  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// PATCH - Update content
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { key, title, content, type, order, isPublished, metadata } = body

    // Cek content exists
    const [existing] = await db.pool.execute<RowDataPacket[]>(
      'SELECT id FROM contents WHERE id = ?',
      [params.id]
    )

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []

    if (key !== undefined) {
      // Cek duplikat key
      const [duplicate] = await db.pool.execute<RowDataPacket[]>(
        'SELECT id FROM contents WHERE `key` = ? AND id != ?',
        [key, params.id]
      )
      if (duplicate.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Key already exists' },
          { status: 400 }
        )
      }
      updates.push('`key` = ?')
      values.push(key)
    }
    if (title !== undefined) {
      updates.push('title = ?')
      values.push(title)
    }
    if (content !== undefined) {
      updates.push('content = ?')
      values.push(content)
    }
    if (type !== undefined) {
      updates.push('type = ?')
      values.push(type)
    }
    if (order !== undefined) {
      updates.push('`order` = ?')
      values.push(order)
    }
    if (isPublished !== undefined) {
      updates.push('is_published = ?')
      values.push(isPublished)
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?')
      values.push(metadata ? JSON.stringify(metadata) : null)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update content
    values.push(params.id)
    await db.pool.execute(
      `UPDATE contents SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Get updated content
    const [rows] = await db.pool.execute<Content[]>(
      'SELECT * FROM contents WHERE id = ?',
      [params.id]
    )

    const updatedContent = {
      ...rows[0],
      metadata: rows[0].metadata ? JSON.parse(rows[0].metadata as any) : null
    }

    return NextResponse.json({
      success: true,
      data: updatedContent,
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

// DELETE - Hapus content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Cek content exists
    const [existing] = await db.pool.execute<RowDataPacket[]>(
      'SELECT id FROM contents WHERE id = ?',
      [params.id]
    )

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Delete content
    await db.pool.execute<ResultSetHeader>(
      'DELETE FROM contents WHERE id = ?',
      [params.id]
    )

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