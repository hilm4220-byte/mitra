    /**
 * File helper untuk testing Supabase connection
 * Jangan import di production code, hanya untuk development/debugging
 */

import { supabase, supabaseAdmin } from './supabase'

/**
 * Test koneksi ke Supabase
 * Gunakan di development untuk verify setup
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')

    // Test 1: Check credentials
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL tidak di-set')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY tidak di-set')
    }

    console.log('✅ Credentials loaded')

    // Test 2: Simple query
    const { data, error } = await supabase
      .from('contact_infos')
      .select('*')
      .limit(1)

    if (error) {
      throw error
    }

    console.log('✅ Query successful')
    console.log('Sample data:', data)

    // Test 3: Check admin key
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('✅ Service role key is available')
    } else {
      console.log('⚠️  Service role key not set (server-side operations may be limited)')
    }

    console.log('✅ All tests passed!')
    return true
  } catch (error) {
    console.error('❌ Supabase connection test failed:')
    console.error(error)
    return false
  }
}

/**
 * List semua tables di Supabase
 */
export async function listTables() {
  try {
    const { data, error } = await supabaseAdmin
      ?.rpc('get_tables')

    if (error) throw error

    console.log('📋 Available tables:')
    console.table(data)
    return data
  } catch (error) {
    console.error('Error listing tables:', error)
    return null
  }
}

/**
 * Get schema dari specific table
 */
export async function getTableSchema(tableName: string) {
  try {
    const { data, error } = await supabaseAdmin
      ?.rpc('get_table_schema', { table_name: tableName })

    if (error) throw error

    console.log(`📋 Schema for "${tableName}":`)
    console.table(data)
    return data
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error)
    return null
  }
}

/**
 * Preview data dari table
 */
export async function previewTable(tableName: string, limit = 5) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit)

    if (error) throw error

    console.log(`📊 Preview of "${tableName}" (first ${limit} rows):`)
    console.table(data)
    return data
  } catch (error) {
    console.error(`Error previewing ${tableName}:`, error)
    return null
  }
}

/**
 * Execute raw SQL query untuk debugging
 */
export async function executeSQL(sql: string) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Service role key not available')
    }

    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      query: sql
    })

    if (error) throw error

    console.log('📋 Query result:')
    console.table(data)
    return data
  } catch (error) {
    console.error('SQL execution error:', error)
    return null
  }
}

export const SupabaseDebug = {
  test: testSupabaseConnection,
  listTables,
  getTableSchema,
  previewTable,
  executeSQL,
}

export default SupabaseDebug
