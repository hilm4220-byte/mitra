// File: app/api/content/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import bcrypt from 'bcryptjs'

// GET - Ambil data dari tabel
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const id = searchParams.get('id')

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Parameter table wajib diisi' },
        { status: 400 }
      )
    }

    const allowedTables = ['admins', 'contact_infos', 'contents', 'registrations']
    if (!allowedTables.includes(table)) {
      return NextResponse.json(
        { success: false, error: 'Tabel tidak valid' },
        { status: 400 }
      )
    }

    let query = `SELECT * FROM ${table}`
    const params: any[] = []

    if (id) {
      query += ' WHERE id = ?'
      params.push(id)
    }

    query += ' ORDER BY created_at DESC'

    // ✔ sesuai db.query() kamu → return rows langsung
    const rows = await db.query<RowDataPacket[]>(query, params)

    return NextResponse.json({
      success: true,
      data: rows
    })

  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}

// POST - Tambah data baru
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Parameter table wajib diisi' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Hash password jika tabel admins
    if (table === 'admins' && body.password) {
      body.password = await bcrypt.hash(body.password, 10)
    }

    // Tambahkan timestamp
    body.created_at = new Date()
    body.updated_at = new Date()

    const columns = Object.keys(body).join(', ')
    const placeholders = Object.keys(body).map(() => '?').join(', ')
    const values = Object.values(body)

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`

    // ✔ execute() milikmu mengembalikan OBJECT, bukan array
    const result = await db.execute(query, values)

    // ✔ Insert ID diambil dari object
    const insertId = (result as ResultSetHeader).insertId

    return NextResponse.json({
      success: true,
      message: 'Data berhasil ditambahkan',
      id: insertId
    })

  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat menambahkan data: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
}

// PUT - Update data
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const id = searchParams.get('id')

    if (!table || !id) {
      return NextResponse.json(
        { success: false, error: 'Parameter table dan id wajib diisi' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Hash password jika admins
    if (table === 'admins' && body.password) {
      body.password = await bcrypt.hash(body.password, 10)
    }

    body.updated_at = new Date()

    const setClause = Object.keys(body).map(key => `${key} = ?`).join(', ')
    const values = [...Object.values(body), id]

    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`

    await db.execute(query, values)

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diupdate'
    })

  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengupdate data: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus data
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const id = searchParams.get('id')

    if (!table || !id) {
      return NextResponse.json(
        { success: false, error: 'Parameter table dan id wajib diisi' },
        { status: 400 }
      )
    }

    const query = `DELETE FROM ${table} WHERE id = ?`

    await db.execute(query, [id])

    return NextResponse.json({
      success: true,
      message: 'Data berhasil dihapus'
    })

  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat menghapus data: ' + (error as Error).message
      },
      { status: 500 }
    )
  }
}
