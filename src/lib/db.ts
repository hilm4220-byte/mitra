// File: lib/db.ts
import mysql, { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

type ConnectionConfig = {
  host: string
  port: number
  user: string
  password: string
  database: string
  waitForConnections: boolean
  connectionLimit: number
  queueLimit: number
}

const config: ConnectionConfig = {
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'mitrajogja',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_POOL_LIMIT ?? 10),
  queueLimit: 0,
}

const pool = mysql.createPool(config)

export type QueryRow<T = any> = T

async function query<T = RowDataPacket>(sql: string, params?: any[]) {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params)
  return rows as T[]
}

async function queryOne<T = RowDataPacket>(sql: string, params?: any[]) {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

async function execute(sql: string, params?: any[]) {
  const [result] = await pool.execute<ResultSetHeader>(sql, params)
  return result
}

async function transaction<T>(handler: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await handler(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function queryWithConnection<T = RowDataPacket>(
  connection: PoolConnection,
  sql: string,
  params?: any[]
) {
  const [rows] = await connection.query<RowDataPacket[]>(sql, params)
  return rows as T[]
}

// ✅ Tambahkan type untuk db export
export type DB = {
  pool: typeof pool
  query: typeof query
  queryOne: typeof queryOne
  execute: typeof execute
  transaction: typeof transaction
  queryWithConnection: typeof queryWithConnection
}

export const db: DB = {
  pool,
  query,
  queryOne,
  execute,
  transaction,
  queryWithConnection,
}

// ✅ Default export juga
export default db