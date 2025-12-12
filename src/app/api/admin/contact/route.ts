import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function untuk convert snake_case ke camelCase
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
      return result
    }, {} as any)
  }
  
  return obj
}

// Helper function untuk convert camelCase ke snake_case
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = toSnakeCase(obj[key])
      return result
    }, {} as any)
  }
  
  return obj
}

// Verify Supabase Auth token
async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No authorization header found')
      return null
    }

    const token = authHeader.split(' ')[1]
    console.log('Verifying Supabase auth token...')

    // Verify token dengan Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('Auth verification error:', error.message)
      return null
    }

    if (!user) {
      console.log('No user found for token')
      return null
    }

    console.log('Auth verified for user:', user.email)
    return user
  } catch (error) {
    console.error('Auth verification exception:', error)
    return null
  }
}

// GET - Ambil semua contact info (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/contact - Fetching contact infos...')
    
    const { data, error } = await supabase
      .from('contact_infos')
      .select('*')
      .order('type')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('Contact infos fetched:', data?.length || 0)

    // Convert snake_case ke camelCase untuk response
    const camelCaseData = toCamelCase(data)

    return NextResponse.json({
      success: true,
      data: camelCaseData
    })
  } catch (error: any) {
    console.error('GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update contact info (AUTH REQUIRED)
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('PUT request body:', JSON.stringify(body, null, 2))
    
    // Cek apakah batch update (array) atau single update
    if (body.contacts && Array.isArray(body.contacts)) {
      // Batch update multiple contacts
      console.log(`Batch updating ${body.contacts.length} contacts by user=${user.email}`)
      
      const results: any[] = []
      const errors: Array<{ type: string; error: string }> = []

      for (const contact of body.contacts) {
        const { type, value, label, isActive, defaultMessage } = contact as {
          type?: string
          value?: string
          label?: string
          isActive?: boolean
          defaultMessage?: string
        }

        if (!type) {
          errors.push({ type: 'unknown', error: 'Type is required' })
          continue
        }

        // Convert camelCase ke snake_case untuk database
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        }

        if (value !== undefined) updateData.value = value
        if (label !== undefined) updateData.label = label
        if (isActive !== undefined) updateData.is_active = isActive
        if (defaultMessage !== undefined) updateData.default_message = defaultMessage

        try {
          const { data, error } = await supabase
            .from('contact_infos')
            .update(updateData)
            .eq('type', type)
            .select()
            .single()

          if (error) {
            console.error(`Error updating type=${type}:`, error)
            errors.push({ type, error: error.message })
          } else if (data) {
            results.push(toCamelCase(data))
          }
        } catch (err: any) {
          console.error(`Exception updating type=${type}:`, err)
          errors.push({ type, error: err?.message || 'Unknown error' })
        }
      }

      console.log(`Batch update completed: ${results.length} success, ${errors.length} errors`)

      return NextResponse.json({
        success: errors.length === 0,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
        message: `Updated ${results.length} contact(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`
      })
    }

    // Single update (original behavior)
    const { type, value, label, isActive, defaultMessage } = body

    if (!type || value === undefined || value === null) {
      console.error('Missing required fields - type:', type, 'value:', value)
      return NextResponse.json(
        { success: false, error: 'Type and value are required', received: { type, value, hasValue: value !== undefined } },
        { status: 400 }
      )
    }

    // Value tidak boleh empty string untuk fields penting
    if (type && typeof value === 'string' && value.trim() === '') {
      console.error('Value cannot be empty string for type:', type)
      return NextResponse.json(
        { success: false, error: 'Value cannot be empty' },
        { status: 400 }
      )
    }

    console.log(`Updating contact info type=${type} by user=${user.email}`)

    // Convert camelCase ke snake_case untuk database
    const updateData: Record<string, any> = {
      value,
      updated_at: new Date().toISOString()
    }

    if (label !== undefined) updateData.label = label
    if (isActive !== undefined) updateData.is_active = isActive
    if (defaultMessage !== undefined) updateData.default_message = defaultMessage

    // Update data
    const { data, error } = await supabase
      .from('contact_infos')
      .update(updateData)
      .eq('type', type)
      .select()
      .single()

    if (error) {
      console.error(`Error updating type=${type}:`, error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Convert response ke camelCase
    const camelCaseData = toCamelCase(data)

    console.log('Contact info updated successfully')

    return NextResponse.json({
      success: true,
      data: camelCaseData,
      message: 'Contact info updated successfully'
    })
  } catch (error: any) {
    console.error('PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new contact info (AUTH REQUIRED)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, value, label, isActive, defaultMessage } = body

    if (!type || !value) {
      return NextResponse.json(
        { success: false, error: 'Type and value are required' },
        { status: 400 }
      )
    }

    console.log(`Creating contact info type=${type} by user=${user.email}`)

    // Convert camelCase ke snake_case
    const insertData = {
      type,
      value,
      label: label || '',
      is_active: isActive !== undefined ? isActive : true,
      default_message: defaultMessage || ''
    }

    const { data, error } = await supabase
      .from('contact_infos')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating contact info:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Convert response ke camelCase
    const camelCaseData = toCamelCase(data)

    return NextResponse.json({
      success: true,
      data: camelCaseData,
      message: 'Contact info created successfully'
    })
  } catch (error: any) {
    console.error('POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Hapus contact info (AUTH REQUIRED)
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Type is required' },
        { status: 400 }
      )
    }

    console.log(`Deleting contact info type=${type} by user=${user.email}`)

    const { error } = await supabase
      .from('contact_infos')
      .delete()
      .eq('type', type)

    if (error) {
      console.error('Error deleting contact info:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact info deleted successfully'
    })
  } catch (error: any) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}