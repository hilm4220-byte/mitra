import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import type { RowDataPacket } from 'mysql2'

type AdminRecord = RowDataPacket & {
  id: string
  username: string
}

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.queryOne<AdminRecord>(
      `SELECT id, username FROM admins WHERE username = ? LIMIT 1`,
      ['admin']
    )

    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create admin
    const adminId = randomUUID()
    const now = new Date()

    await db.execute(
      `INSERT INTO admins (
        id,
        username,
        email,
        password,
        fullName,
        role,
        isActive,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        'admin',
        'admin@pijatjogja.com',
        hashedPassword,
        'Administrator',
        'SUPER_ADMIN',
        1,
        now,
        now,
      ]
    )

    console.log('Admin created successfully:')
    console.log('Username: admin')
    console.log('Password: admin123')
    console.log('Email: admin@pijatjogja.com')
    console.log('Admin ID:', adminId)

  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await db.pool.end()
  }
}

createAdmin()