import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔍 Checking environment variables...')
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing required Supabase environment variables!')
  console.error('\n📝 Please add these to your .env.local file:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('\n🔑 You can find these in your Supabase dashboard:')
  console.error('- Project URL: Settings > API')
  console.error('- Service Role Key: Settings > API (scroll down)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface AdminData {
  email: string
  password: string
  fullName: string
  role: 'admin' | 'superadmin'
}

const adminUsers: AdminData[] = [
  {
    email: 'admin@pijatjogja.com',
    password: 'admin123',
    fullName: 'Admin PijatJogja',
    role: 'superadmin'
  },
  {
    email: 'admin2@pijatjogja.com',
    password: 'admin123',
    fullName: 'Admin Kedua',
    role: 'admin'
  }
]

async function createAdminUser(adminData: AdminData) {
  try {
    console.log(`Creating admin user: ${adminData.email}`)

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        full_name: adminData.fullName,
        role: adminData.role
      }
    })

    if (authError) {
      console.error(`Error creating auth user ${adminData.email}:`, authError)
      return false
    }

    console.log(`✓ Created auth user: ${authData.user?.id}`)

    // Update user metadata to include role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user!.id,
      {
        user_metadata: {
          full_name: adminData.fullName,
          role: adminData.role
        }
      }
    )

    if (updateError) {
      console.error(`Error updating user metadata for ${adminData.email}:`, updateError)
      return false
    }

    console.log(`✓ Updated user metadata for: ${adminData.email}`)
    return true

  } catch (error) {
    console.error(`Unexpected error creating admin ${adminData.email}:`, error)
    return false
  }
}

async function createContactInfos() {
  console.log('\n=== Creating Contact Infos ===')

  const contactInfos = [
    {
      type: 'whatsapp',
      label: 'WhatsApp Utama',
      value: '+6281234567890',
      isActive: true
    },
    {
      type: 'phone',
      label: 'Telepon',
      value: '+622740123456',
      isActive: true
    },
    {
      type: 'email',
      label: 'Email',
      value: 'info@pijatjogja.com',
      isActive: true
    },
    {
      type: 'address',
      label: 'Alamat',
      value: 'Jl. Malioboro No. 123, Yogyakarta',
      isActive: true
    }
  ]

  for (const contact of contactInfos) {
    try {
      const { data, error } = await supabase
        .from('contact_infos')
        .insert({
          ...contact,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error(`Error creating contact ${contact.type}:`, error)
      } else {
        console.log(`✓ Created contact: ${contact.type} - ${contact.label}`)
      }
    } catch (error) {
      console.error(`Unexpected error creating contact ${contact.type}:`, error)
    }
  }
}

async function createWhatsAppTemplates() {
  console.log('\n=== Creating WhatsApp Templates ===')

  const templates = [
    {
      name: 'Welcome Message',
      template: 'Halo {fullName}! Terima kasih telah mendaftar sebagai terapis di PijatJogja. Kami akan segera memproses pendaftaran Anda.',
      type: 'welcome',
      isActive: true
    },
    {
      name: 'Approval Message',
      template: 'Selamat {fullName}! Pendaftaran Anda sebagai terapis di PijatJogja telah disetujui. Silakan login ke aplikasi untuk mulai bekerja.',
      type: 'approval',
      isActive: true
    },
    {
      name: 'Rejection Message',
      template: 'Halo {fullName}, maaf pendaftaran Anda sebagai terapis di PijatJogja belum dapat disetujui saat ini. Silakan hubungi kami untuk informasi lebih lanjut.',
      type: 'rejection',
      isActive: true
    }
  ]

  for (const template of templates) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert({
          ...template,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error(`Error creating template ${template.name}:`, error)
      } else {
        console.log(`✓ Created template: ${template.name}`)
      }
    } catch (error) {
      console.error(`Unexpected error creating template ${template.name}:`, error)
    }
  }
}

async function createSampleContent() {
  console.log('\n=== Creating Sample Content ===')

  const contents = [
    {
      key: 'hero_title',
      title: 'Pijat Tradisional Jogja',
      content: 'Layanan pijat tradisional terbaik di Yogyakarta dengan terapis profesional dan berpengalaman.',
      type: 'text',
      is_published: true,
      order: 1
    },
    {
      key: 'hero_subtitle',
      title: 'Sub Judul Hero',
      content: 'Rasakan sensasi pijat yang menenangkan dan menyegarkan tubuh Anda.',
      type: 'text',
      is_published: true,
      order: 2
    },
    {
      key: 'about_us',
      title: 'Tentang Kami',
      content: 'PijatJogja adalah layanan pijat tradisional yang telah berpengalaman lebih dari 10 tahun di Yogyakarta. Kami berkomitmen memberikan pelayanan terbaik dengan terapis profesional.',
      type: 'text',
      is_published: true,
      order: 3
    },
    {
      key: 'services',
      title: 'Layanan Kami',
      content: 'Kami menyediakan berbagai jenis pijat tradisional seperti pijat relaksasi, pijat refleksi, dan pijat khusus untuk berbagai keluhan kesehatan.',
      type: 'text',
      is_published: true,
      order: 4
    }
  ]

  for (const content of contents) {
    try {
      const { data, error } = await supabase
        .from('contents')
        .insert({
          ...content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error(`Error creating content ${content.key}:`, error)
      } else {
        console.log(`✓ Created content: ${content.key}`)
      }
    } catch (error) {
      console.error(`Unexpected error creating content ${content.key}:`, error)
    }
  }
}

async function main() {
  console.log('🚀 Starting admin data creation...\n')

  try {
    // Create admin users
    console.log('=== Creating Admin Users ===')
    for (const adminData of adminUsers) {
      const success = await createAdminUser(adminData)
      if (success) {
        console.log(`✅ Successfully created admin: ${adminData.email}\n`)
      } else {
        console.log(`❌ Failed to create admin: ${adminData.email}\n`)
      }
    }

    // Create contact infos
    await createContactInfos()

    // Create WhatsApp templates
    await createWhatsAppTemplates()

    // Create sample content
    await createSampleContent()

    console.log('\n🎉 Admin data creation completed!')
    console.log('\n📋 Summary:')
    console.log('- Admin users created with authentication')
    console.log('- Contact information seeded')
    console.log('- WhatsApp templates created')
    console.log('- Sample content added')
    console.log('\n🔐 Admin Credentials:')
    adminUsers.forEach(admin => {
      console.log(`- ${admin.email}: ${admin.password} (${admin.role})`)
    })

  } catch (error) {
    console.error('❌ Error in main execution:', error)
    process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
