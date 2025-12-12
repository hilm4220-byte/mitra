import { supabase, supabaseAdmin } from './supabase'

export type QueryRow<T = any> = T

// Query data dari Supabase
async function query<T = any>(table: string, filters?: Record<string, any>) {
  let query = supabase.from(table).select('*')

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }

  const { data, error } = await query
  if (error) throw error
  return data as T[]
}

// Query single row
async function queryOne<T = any>(table: string, filters?: Record<string, any>) {
  const results = await query<T>(table, filters)
  return results[0] ?? null
}

// Execute insert/update/delete
async function execute(operation: 'insert' | 'update' | 'delete', table: string, payload?: any, filters?: Record<string, any>) {
  const admin = supabaseAdmin || supabase

  try {
    switch (operation) {
      case 'insert':
        const { data: insertData, error: insertError } = await admin
          .from(table)
          .insert(payload)
          .select()
        if (insertError) throw insertError
        return insertData

      case 'update':
        let updateQuery = admin.from(table).update(payload)
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            updateQuery = updateQuery.eq(key, value)
          })
        }
        const { data: updateData, error: updateError } = await updateQuery.select()
        if (updateError) throw updateError
        return updateData

      case 'delete':
        let deleteQuery = admin.from(table)
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value)
          })
        }
        const { error: deleteError } = await deleteQuery.delete()
        if (deleteError) throw deleteError
        return { success: true }

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  } catch (error) {
    console.error(`Database error (${operation} on ${table}):`, error)
    throw error
  }
}

// Raw SQL query (untuk operasi kompleks)
async function rawQuery<T = any>(sql: string, params?: any[]) {
  const admin = supabaseAdmin || supabase

  const { data, error } = await admin.rpc('execute_sql', {
    query: sql,
    params: params || [],
  })

  if (error) throw error
  return data as T[]
}

// Transaction simulation
async function transaction<T>(handler: (db: typeof db) => Promise<T>): Promise<T> {
  try {
    // Supabase menangani transactions di level database
    const result = await handler(db)
    return result
  } catch (error) {
    console.error('Transaction error:', error)
    throw error
  }
}

export type DB = {
  query: typeof query
  queryOne: typeof queryOne
  execute: typeof execute
  rawQuery: typeof rawQuery
  transaction: typeof transaction
}

export const db: DB = {
  query,
  queryOne,
  execute,
  rawQuery,
  transaction,
}

export default db
