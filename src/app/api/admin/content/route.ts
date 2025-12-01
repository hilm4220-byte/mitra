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

// GET - Ambil semua content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const key = searchParams.get('key')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build WHERE clause
    let whereClause = '1=1'
    const params: any[] = []

    if (type) {
      whereClause += ' AND type = ?'
      params.push(type)
    }
    
    if (key) {
      whereClause += ' AND `key` = ?'
      params.push(key)
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    // Get total count
    const [countResult] = await db.pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM contents WHERE ${whereClause}`,
      params
    )
    const total = countResult[0].total

    // Get contents
    const [rows] = await db.pool.execute<Content[]>(
      `SELECT * FROM contents 
       WHERE ${whereClause}
       ORDER BY \`order\` ASC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    // Parse JSON metadata
    const contents = rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata as any) : null
    }))

    return NextResponse.json({
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// POST - Buat content baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, title, content, type, order = 0, isPublished = true, metadata } = body

    // Validasi
    if (!key || !title || !content || !type) {
      return NextResponse.json(
        { success: false, error: 'Key, title, content, and type are required' },
        { status: 400 }
      )
    }

    // Cek duplikat key
    const [existing] = await db.pool.execute<RowDataPacket[]>(
      'SELECT id FROM contents WHERE `key` = ?',
      [key]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Key already exists' },
        { status: 400 }
      )
    }

    // Insert content
    const [result] = await db.pool.execute<ResultSetHeader>(
      `INSERT INTO contents (\`key\`, title, content, type, \`order\`, is_published, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        key,
        title,
        content,
        type,
        order,
        isPublished,
        metadata ? JSON.stringify(metadata) : null
      ]
    )

    // Get inserted content
    const [rows] = await db.pool.execute<Content[]>(
      'SELECT * FROM contents WHERE id = ?',
      [result.insertId]
    )

    return NextResponse.json({
      success: true,
      data: rows[0],
      message: 'Content created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Content creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    )
  }
}