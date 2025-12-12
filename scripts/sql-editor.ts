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

async function executeSQL(sql: string, description: string) {
  try {
    console.log(`\n🔄 Executing: ${description}`)
    console.log(`SQL: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`)

    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error(`❌ Error executing ${description}:`, error)
      return false
    }

    console.log(`✅ Successfully executed: ${description}`)
    return true
  } catch (error) {
    console.error(`💥 Unexpected error executing ${description}:`, error)
    return false
  }
}

async function createTherapistsData() {
  console.log('\n=== Creating Therapists Data ===')

  const therapistsData = [
    {
      id: 'therapist-001',
      registrationId: 'reg-001',
      fullName: 'Siti Aminah',
      whatsapp: '+6281234567891',
      address: 'Jl. Malioboro No. 1, Yogyakarta',
      gender: 'female',
      experience: '5 tahun',
      workArea: 'Yogyakarta Kota',
      availability: 'Senin-Jumat, 08:00-17:00',
      message: 'Berpengalaman dalam pijat tradisional Jawa',
      status: 'ACTIVE'
    },
    {
      id: 'therapist-002',
      registrationId: 'reg-002',
      fullName: 'Ahmad Rahman',
      whatsapp: '+6281234567892',
      address: 'Jl. Prawirotaman No. 15, Yogyakarta',
      gender: 'male',
      experience: '3 tahun',
      workArea: 'Sleman',
      availability: 'Selasa-Sabtu, 09:00-18:00',
      message: 'Spesialis pijat refleksi dan relaksasi',
      status: 'ACTIVE'
    },
    {
      id: 'therapist-003',
      registrationId: 'reg-003',
      fullName: 'Dewi Sartika',
      whatsapp: '+6281234567893',
      address: 'Jl. Sosrowijayan No. 25, Yogyakarta',
      gender: 'female',
      experience: '7 tahun',
      workArea: 'Bantul',
      availability: 'Senin-Sabtu, 07:00-16:00',
      message: 'Terapis pijat dengan sertifikasi nasional',
      status: 'ACTIVE'
    }
  ]

  for (const therapist of therapistsData) {
    // Check if therapist already exists
    const { data: existing } = await supabase
      .from('therapists')
      .select('id')
      .eq('whatsapp', therapist.whatsapp)
      .single()

    if (existing) {
      console.log(`⏭️  Therapist ${therapist.fullName} already exists, skipping...`)
      continue
    }

    const { error } = await supabase
      .from('therapists')
      .insert({
        ...therapist,
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (error) {
      console.error(`❌ Error creating therapist ${therapist.fullName}:`, error)
    } else {
      console.log(`✅ Created therapist: ${therapist.fullName}`)
    }
  }
}

async function createTherapistRegistrationsData() {
  console.log('\n=== Creating Therapist Registrations Data ===')

  const registrationsData = [
    {
      id: 'reg-001',
      fullName: 'Siti Aminah',
      whatsapp: '+6281234567891',
      address: 'Jl. Malioboro No. 1, Yogyakarta',
      gender: 'female',
      experience: '5 tahun',
      workArea: 'Yogyakarta Kota',
      availability: 'Senin-Jumat, 08:00-17:00',
      message: 'Berpengalaman dalam pijat tradisional Jawa',
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    },
    {
      id: 'reg-002',
      fullName: 'Ahmad Rahman',
      whatsapp: '+6281234567892',
      address: 'Jl. Prawirotaman No. 15, Yogyakarta',
      gender: 'male',
      experience: '3 tahun',
      workArea: 'Sleman',
      availability: 'Selasa-Sabtu, 09:00-18:00',
      message: 'Spesialis pijat refleksi dan relaksasi',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    },
    {
      id: 'reg-003',
      fullName: 'Dewi Sartika',
      whatsapp: '+6281234567893',
      address: 'Jl. Sosrowijayan No. 25, Yogyakarta',
      gender: 'female',
      experience: '7 tahun',
      workArea: 'Bantul',
      availability: 'Senin-Sabtu, 07:00-16:00',
      message: 'Terapis pijat dengan sertifikasi nasional',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }
  ]

  for (const registration of registrationsData) {
    // Check if registration already exists
    const { data: existing } = await supabase
      .from('therapist_registrations')
      .select('id')
      .eq('id', registration.id)
      .single()

    if (existing) {
      console.log(`⏭️  Registration ${registration.id} already exists, skipping...`)
      continue
    }

    const { error } = await supabase
      .from('therapist_registrations')
      .insert(registration)

    if (error) {
      console.error(`❌ Error creating registration ${registration.id}:`, error)
    } else {
      console.log(`✅ Created registration: ${registration.id} - ${registration.fullName}`)
    }
  }
}

async function createContactInfosData() {
  console.log('\n=== Creating Contact Infos Data ===')

  const contactInfosData = [
    {
      type: 'whatsapp',
      label: 'WhatsApp Utama',
      value: '+6281234567890',
      isActive: true
    },
    {
      type: 'phone',
      label: 'Telepon Kantor',
      value: '+622740123456',
      isActive: true
    },
    {
      type: 'email',
      label: 'Email Utama',
      value: 'info@pijatjogja.com',
      isActive: true
    },
    {
      type: 'address',
      label: 'Alamat Kantor',
      value: 'Jl. Malioboro No. 123, Yogyakarta 55271',
      isActive: true
    },
    {
      type: 'instagram',
      label: 'Instagram',
      value: '@pijatjogja',
      isActive: true
    },
    {
      type: 'facebook',
      label: 'Facebook',
      value: 'Pijat Jogja Official',
      isActive: true
    }
  ]

  for (const contact of contactInfosData) {
    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contact_infos')
      .select('id')
      .eq('type', contact.type)
      .eq('value', contact.value)
      .single()

    if (existing) {
      console.log(`⏭️  Contact ${contact.type} already exists, skipping...`)
      continue
    }

    const { error } = await supabase
      .from('contact_infos')
      .insert({
        ...contact,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (error) {
      console.error(`❌ Error creating contact ${contact.type}:`, error)
    } else {
      console.log(`✅ Created contact: ${contact.type} - ${contact.label}`)
    }
  }
}

async function createWhatsAppTemplatesData() {
  console.log('\n=== Creating WhatsApp Templates Data ===')

  const templatesData = [
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
    },
    {
      name: 'Reminder Message',
      template: 'Halo {fullName}, ingatkan untuk mengupdate status ketersediaan Anda hari ini. Terima kasih atas kerja kerasnya!',
      type: 'reminder',
      isActive: true
    },
    {
      name: 'Booking Confirmation',
      template: 'Halo {fullName}, booking pijat Anda telah dikonfirmasi untuk tanggal {date} pukul {time}. Terapis kami akan segera menghubungi Anda.',
      type: 'booking',
      isActive: true
    }
  ]

  for (const template of templatesData) {
    // Check if template already exists
    const { data: existing } = await supabase
      .from('whatsapp_templates')
      .select('id')
      .eq('name', template.name)
      .single()

    if (existing) {
      console.log(`⏭️  Template ${template.name} already exists, skipping...`)
      continue
    }

    const { error } = await supabase
      .from('whatsapp_templates')
      .insert({
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

    if (error) {
      console.error(`❌ Error creating template ${template.name}:`, error)
    } else {
      console.log(`✅ Created template: ${template.name}`)
    }
  }
}

async function createContentsData() {
  console.log('\n=== Creating Contents Data ===')

  const contentsData = [
    {
      key: 'hero_title',
      title: 'Pijat Tradisional Jogja',
      content: 'Layanan pijat tradisional terbaik di Yogyakarta dengan terapis profesional dan berpengalaman. Rasakan sensasi pijat yang menenangkan dan menyegarkan tubuh Anda.',
      type: 'text',
      is_published: true,
      order: 1
    },
    {
      key: 'hero_subtitle',
      title: 'Sub Judul Hero',
      content: 'Kami berkomitmen memberikan pelayanan pijat tradisional yang berkualitas dengan harga terjangkau. Terapis kami telah tersertifikasi dan berpengalaman.',
      type: 'text',
      is_published: true,
      order: 2
    },
    {
      key: 'about_us',
      title: 'Tentang Kami',
      content: 'PijatJogja adalah layanan pijat tradisional yang telah berpengalaman lebih dari 10 tahun di Yogyakarta. Kami berkomitmen memberikan pelayanan terbaik dengan terapis profesional yang telah tersertifikasi.',
      type: 'text',
      is_published: true,
      order: 3
    },
    {
      key: 'services',
      title: 'Layanan Kami',
      content: 'Kami menyediakan berbagai jenis pijat tradisional seperti pijat relaksasi, pijat refleksi, pijat khusus untuk berbagai keluhan kesehatan, dan masih banyak lagi. Semua layanan kami menggunakan teknik tradisional yang telah terbukti efektif.',
      type: 'text',
      is_published: true,
      order: 4
    },
    {
      key: 'benefits',
      title: 'Keunggulan Kami',
      content: 'Terapis profesional bersertifikat, harga terjangkau, lokasi strategis, booking online 24/7, dan garansi kepuasan pelanggan. Kami juga menyediakan layanan antar-jemput dalam radius tertentu.',
      type: 'text',
      is_published: true,
      order: 5
    },
    {
      key: 'testimonials',
      title: 'Testimoni Pelanggan',
      content: '"Pelayanan sangat memuaskan, terapisnya profesional dan ramah. Sudah 3 tahun jadi langganan di sini!" - Ibu Siti, Yogyakarta\n\n"Sangat recommended untuk yang butuh relaksasi setelah kerja. Harga worth it!" - Pak Ahmad, Sleman',
      type: 'text',
      is_published: true,
      order: 6
    }
  ]

  for (const content of contentsData) {
    // Check if content already exists
    const { data: existing } = await supabase
      .from('contents')
      .select('id')
      .eq('key', content.key)
      .single()

    if (existing) {
      console.log(`⏭️  Content ${content.key} already exists, skipping...`)
      continue
    }

    const { error } = await supabase
      .from('contents')
      .insert({
        ...content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error(`❌ Error creating content ${content.key}:`, error)
    } else {
      console.log(`✅ Created content: ${content.key}`)
    }
  }
}

async function main() {
  console.log('🚀 Starting SQL Editor - Creating New Data for All Databases...\n')

  try {
    // Create data for all tables with IF NOT EXISTS logic
    await createTherapistsData()
    await createTherapistRegistrationsData()
    await createContactInfosData()
    await createWhatsAppTemplatesData()
    await createContentsData()

    console.log('\n🎉 SQL Editor execution completed successfully!')
    console.log('\n📋 Summary:')
    console.log('- Therapists data created/updated')
    console.log('- Therapist registrations data created/updated')
    console.log('- Contact information data created/updated')
    console.log('- WhatsApp templates data created/updated')
    console.log('- Content data created/updated')
    console.log('\n✅ All data creation completed with IF NOT EXISTS checks!')

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
