import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'
import bcrypt from 'bcryptjs'

type AdminRecord = RowDataPacket & {
  id: string
  username: string
  email: string
  password: string
  fullName: string
  role: string
  isActive: number
  createdAt: Date
  updatedAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      )
    }

    // Cari admin berdasarkan username atau email
    const admin = await db.queryOne<AdminRecord>(
      `SELECT * FROM admins WHERE (username = ? OR email = ?) AND isActive = 1 LIMIT 1`,
      [username, username]
    )

    if (!admin) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Buat session token (simplified, dalam production gunakan JWT)
    const sessionToken = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64')

    // Return admin data tanpa password
    const { password: _, isActive, ...adminData } = admin

    const normalizedAdmin = {
      ...adminData,
      isActive: Boolean(isActive)
    }

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      admin: normalizedAdmin,
      token: sessionToken
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}