import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

type AdminRecord = RowDataPacket & {
  id: string
  username: string
  email: string
  isActive: number
}

type RegistrationRow = RowDataPacket & {
  id: string
  fullName: string
  whatsapp: string
  address: string
  gender: string
  experience: string
  workArea: string
  availability: string
  message: string | null
  status: string
  submittedAt: Date
  updatedAt: Date
  therapistId: string | null
  therapistStatus: string | null
  therapistJoinedAt: Date | null
}

type CountRow = RowDataPacket & {
  total: number
}

function validateAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [adminId] = decoded.split(':')
    return adminId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  console.log('\n=== START GET REGISTRATIONS ===')
  
  try {
    // 1. Test koneksi database
    console.log('1. Testing database connection...')
    try {
      const testResult = await db.query('SELECT 1 as test')
      console.log('   ✓ Database connection OK')
    } catch (dbError) {
      console.error('   ✗ Database connection FAILED:', dbError)
      throw dbError
    }

    // 2. Validasi token
    console.log('2. Validating admin token...')
    const adminId = validateAdminToken(request)
    console.log('   Admin ID:', adminId)
    
    if (!adminId) {
      console.log('   ✗ No admin token found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('   ✓ Token valid')

    // 3. Cek admin di database
    console.log('3. Checking admin in database...')
    try {
      const admin = await db.queryOne<AdminRecord>(
        `SELECT id, username, email, isActive FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
        [adminId]
      )
      console.log('   Admin found:', admin ? `${admin.username} (${admin.email})` : 'NULL')

      if (!admin) {
        console.log('   ✗ Admin not found or inactive')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      console.log('   ✓ Admin authorized')
    } catch (adminError) {
      console.error('   ✗ Error checking admin:', adminError)
      throw adminError
    }

    // 4. Parse query parameters
    console.log('4. Parsing query parameters...')
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    console.log('   Params:', { page, limit, status, search })

    const skip = (page - 1) * limit

    // 5. Build filters
    console.log('5. Building filters...')
    const filters: string[] = []
    const filterParams: any[] = []

    if (status) {
      filters.push('tr.status = ?')
      filterParams.push(status)
    }

    if (search) {
      filters.push('(tr.fullName LIKE ? OR tr.whatsapp LIKE ? OR tr.address LIKE ?)')
      const likeValue = `%${search}%`
      filterParams.push(likeValue, likeValue, likeValue)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
    console.log('   WHERE clause:', whereClause || 'NONE')
    console.log('   Filter params:', filterParams)

    // 6. Query registrations
    console.log('6. Querying registrations...')
    const querySQL = `SELECT tr.*, t.id AS therapistId, t.status AS therapistStatus, t.joinedAt AS therapistJoinedAt
       FROM therapist_registrations tr
       LEFT JOIN therapists t ON t.registrationId = tr.id
       ${whereClause}
       ORDER BY tr.submittedAt DESC
       LIMIT ? OFFSET ?`
    
    console.log('   SQL:', querySQL)
    console.log('   Params:', [...filterParams, limit, skip])
    
    try {
      const registrations = await db.query<RegistrationRow>(
        querySQL,
        [...filterParams, limit, skip]
      )
      console.log(`   ✓ Found ${registrations.length} registrations`)
    } catch (queryError) {
      console.error('   ✗ Query FAILED:', queryError)
      throw queryError
    }

    // 7. Count total
    console.log('7. Counting total registrations...')
    const countSQL = `SELECT COUNT(*) AS total
       FROM therapist_registrations tr
       ${whereClause}`
    
    console.log('   SQL:', countSQL)
    console.log('   Params:', filterParams)
    
    let countRow: CountRow | null = null
    try {
      countRow = await db.queryOne<CountRow>(countSQL, filterParams)
      console.log('   ✓ Total count:', countRow?.total ?? 0)
    } catch (countError) {
      console.error('   ✗ Count query FAILED:', countError)
      throw countError
    }

    // 8. Re-query registrations (karena sebelumnya hanya untuk test)
    const registrations = await db.query<RegistrationRow>(
      querySQL,
      [...filterParams, limit, skip]
    )

    // 9. Normalize data
    console.log('8. Normalizing data...')
    const normalizedRegistrations = registrations.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      whatsapp: row.whatsapp,
      address: row.address,
      gender: row.gender,
      experience: row.experience,
      workArea: row.workArea,
      availability: row.availability,
      message: row.message,
      status: row.status,
      submittedAt: row.submittedAt,
      updatedAt: row.updatedAt,
      therapist: row.therapistId
        ? {
            id: row.therapistId,
            status: row.therapistStatus,
            joinedAt: row.therapistJoinedAt,
          }
        : null,
    }))

    console.log('9. Returning response...')
    console.log('=== END GET REGISTRATIONS (SUCCESS) ===\n')

    return NextResponse.json({
      success: true,
      data: normalizedRegistrations,
      pagination: {
        page,
        limit,
        total: countRow?.total ?? 0,
        pages: Math.ceil((countRow?.total ?? 0) / limit)
      }
    })

  } catch (error) {
    console.error('\n=== ERROR GET REGISTRATIONS ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('=== END ERROR ===\n')
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}

// ============================================
// TAMBAHAN: PATCH untuk update status
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n=== START PATCH REGISTRATION STATUS ===')
  
  try {
    // Validasi token
    const adminId = validateAdminToken(request)
    
    if (!adminId) {
      console.log('   ✗ No admin token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('   ✓ Admin ID:', adminId)

    // Cek admin di database
    const admin = await db.queryOne<AdminRecord>(
      `SELECT id, username, email, isActive FROM admins WHERE id = ? AND isActive = 1 LIMIT 1`,
      [adminId]
    )

    if (!admin) {
      console.log('   ✗ Admin not found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('   ✓ Admin:', admin.username)

    // Get registration ID
    const registrationId = params.id
    console.log('   Registration ID:', registrationId)

    // Parse request body
    const body = await request.json()
    const { action, notes } = body
    console.log('   Body received:', JSON.stringify(body))
    console.log('   Action:', action)
    console.log('   Notes:', notes ? 'YES' : 'NO')

    // Validasi action
    if (!action || !['APPROVE', 'REJECT', 'PENDING'].includes(action)) {
      console.log('   ✗ Invalid action:', action)
      return NextResponse.json(
        { error: `Action harus APPROVE, REJECT, atau PENDING. Diterima: ${action}` },
        { status: 400 }
      )
    }
    console.log('   ✓ Action valid')

    // Map action ke status
    const statusMap: Record<string, string> = {
      'APPROVE': 'APPROVED',
      'REJECT': 'REJECTED',
      'PENDING': 'PENDING'
    }
    const newStatus = statusMap[action]
    console.log('   New status:', newStatus)

    // Cek apakah registration exists
    console.log('   Checking registration...')
    const existingRegistration = await db.queryOne<RegistrationRow>(
      'SELECT * FROM therapist_registrations WHERE id = ? LIMIT 1',
      [registrationId]
    )

    if (!existingRegistration) {
      console.log('   ✗ Registration not found')
      return NextResponse.json(
        { error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      )
    }
    console.log('   ✓ Registration found, current status:', existingRegistration.status)

    // Update status
    console.log('   Updating status...')
    const updateSQL = notes
      ? 'UPDATE therapist_registrations SET status = ?, notes = ?, updatedAt = NOW() WHERE id = ?'
      : 'UPDATE therapist_registrations SET status = ?, updatedAt = NOW() WHERE id = ?'
    
    const updateParams = notes
      ? [newStatus, notes, registrationId]
      : [newStatus, registrationId]

    console.log('   SQL:', updateSQL)
    console.log('   Params:', updateParams)

    await db.query(updateSQL, updateParams)
    console.log('   ✓ Status updated')

    // Jika APPROVED, buat therapist account (jika belum ada)
    if (action === 'APPROVE') {
      console.log('   Checking therapist account...')
      const existingTherapist = await db.queryOne(
        'SELECT id FROM therapists WHERE registrationId = ? LIMIT 1',
        [registrationId]
      )

      if (!existingTherapist) {
        console.log('   Creating therapist account...')
        await db.query(
          `INSERT INTO therapists (registrationId, fullName, whatsapp, address, gender, experience, workArea, availability, status, joinedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW(), NOW())`,
          [
            registrationId,
            existingRegistration.fullName,
            existingRegistration.whatsapp,
            existingRegistration.address,
            existingRegistration.gender,
            existingRegistration.experience,
            existingRegistration.workArea,
            existingRegistration.availability
          ]
        )
        console.log('   ✓ Therapist created')
      } else {
        console.log('   ℹ Therapist already exists')
      }
    }

    console.log('=== END PATCH REGISTRATION STATUS (SUCCESS) ===\n')

    return NextResponse.json({
      success: true,
      message: `Pendaftaran berhasil di${action === 'APPROVE' ? 'setujui' : action === 'REJECT' ? 'tolak' : 'ubah'}`,
      data: {
        id: registrationId,
        status: newStatus,
        updatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('\n=== ERROR PATCH REGISTRATION STATUS ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('=== END ERROR ===\n')
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengubah status' },
      { status: 500 }
    )
  }
}