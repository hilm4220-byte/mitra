// app/api/admin/debug/route.ts
// TEMPORARY DEBUG ENDPOINT - DELETE AFTER FIXING
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  console.log('\n=== DATABASE STRUCTURE CHECK ===')
  
  try {
    // 1. Check connection
    console.log('1. Testing connection...')
    await db.query('SELECT 1')
    console.log('   ✓ Connection OK')

    // 2. List all tables
    console.log('2. Listing tables...')
    const tables = await db.query('SHOW TABLES')
    console.log('   Tables:', tables)

    // 3. Check if therapist_registrations exists
    console.log('3. Checking therapist_registrations...')
    try {
      const structure = await db.query('DESCRIBE therapist_registrations')
      console.log('   ✓ Table exists')
      console.log('   Columns:', structure)
    } catch (err: any) {
      console.log('   ✗ Table does NOT exist')
      console.log('   Error:', err.message)
    }

    // 4. Check if therapists exists
    console.log('4. Checking therapists...')
    try {
      const structure = await db.query('DESCRIBE therapists')
      console.log('   ✓ Table exists')
      console.log('   Columns:', structure)
    } catch (err: any) {
      console.log('   ✗ Table does NOT exist')
      console.log('   Error:', err.message)
    }

    // 5. Check admins table
    console.log('5. Checking admins...')
    try {
      const structure = await db.query('DESCRIBE admins')
      console.log('   ✓ Table exists')
      console.log('   Columns:', structure)
    } catch (err: any) {
      console.log('   ✗ Table does NOT exist')
      console.log('   Error:', err.message)
    }

    // 6. Count registrations
    console.log('6. Counting registrations...')
    try {
      const count = await db.query('SELECT COUNT(*) as total FROM therapist_registrations')
      console.log('   ✓ Count:', count)
    } catch (err: any) {
      console.log('   ✗ Failed to count')
      console.log('   Error:', err.message)
    }

    console.log('=== END CHECK ===\n')

    return NextResponse.json({
      success: true,
      message: 'Check console logs in terminal for details',
      tables: tables
    })

  } catch (error: any) {
    console.error('\n=== ERROR ===')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    console.error('=== END ERROR ===\n')

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}