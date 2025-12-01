import { db } from '../src/lib/db'
import { randomUUID } from 'crypto'

async function seedContent() {
  try {
    // Seed Website Content
    const websiteContents = [
      {
        key: 'benefits_title',
        title: 'Keuntungan Jadi Mitra PijatJogja',
        subtitle: 'Bergabunglah dengan kami dan nikmati berbagai keuntungan',
        content: ''
      },
      {
        key: 'benefit_1',
        title: 'Order Rutin & Terjamin',
        subtitle: 'Sistem otomatis mencocokkan pelanggan terdekat.',
        content: ''
      },
      {
        key: 'benefit_2',
        title: 'Kerja Sesuai Waktu Anda',
        subtitle: 'Bebas pilih hari dan jam kerja.',
        content: ''
      },
      {
        key: 'benefit_3',
        title: 'Pembayaran Cepat & Transparan',
        subtitle: 'Pembagian hasil jelas, langsung ke rekening.',
        content: ''
      },
      {
        key: 'benefit_4',
        title: 'Pelatihan & Sertifikasi',
        subtitle: 'Gratis! Biar makin profesional dan dipercaya pelanggan.',
        content: ''
      },
      {
        key: 'benefit_5',
        title: 'Support Komunitas',
        subtitle: 'Grup komunitas dan mentor siap bantu kapan pun.',
        content: ''
      },
      {
        key: 'benefit_6',
        title: 'Keamanan Terjamin',
        subtitle: 'Sistem keamanan dan asuransi untuk semua mitra.',
        content: ''
      },
      {
        key: 'contact_title',
        title: 'Hubungi Kami',
        subtitle: 'Ingin bertanya lebih lanjut? Tim kami siap membantu Anda.',
        content: ''
      },
      {
        key: 'contact_button',
        title: 'Chat Admin Sekarang',
        subtitle: '',
        content: ''
      }
    ]

    for (const content of websiteContents) {
      const now = new Date()
      await db.execute(
        `INSERT INTO website_contents (
          id,
          \`key\`,
          title,
          subtitle,
          content,
          isActive,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          subtitle = VALUES(subtitle),
          content = VALUES(content),
          isActive = VALUES(isActive),
          updatedAt = VALUES(updatedAt)`,
        [
          randomUUID(),
          content.key,
          content.title,
          content.subtitle || null,
          content.content || null,
          1,
          now,
          now,
        ]
      )
    }

    // Seed Contact Info
    const contactInfos = [
      {
        type: 'address',
        label: 'Alamat',
        value: 'Jl. Malioboro No. 123, Jogja'
      },
      {
        type: 'whatsapp',
        label: 'WhatsApp',
        value: '0812-3456-7890'
      },
      {
        type: 'email',
        label: 'Email',
        value: 'info@pijatjogja.com'
      }
    ]

    for (const contact of contactInfos) {
      const now = new Date()
      await db.execute(
        `INSERT INTO contact_infos (
          id,
          type,
          label,
          value,
          isActive,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          label = VALUES(label),
          value = VALUES(value),
          isActive = VALUES(isActive),
          updatedAt = VALUES(updatedAt)`,
        [
          randomUUID(),
          contact.type,
          contact.label,
          contact.value,
          1,
          now,
          now,
        ]
      )
    }

    // Seed WhatsApp Templates
    const whatsappTemplates = [
      {
        type: 'registration_approved',
        title: 'Pendaftaran Disetujui',
        message: 'Selamat 🎉 pendaftaran Anda sebagai mitra PijatJogja telah disetujui! Selamat datang di keluarga besar PijatJogja. Kami akan segera menghubungi Anda untuk proses selanjutnya.'
      },
      {
        type: 'registration_rejected',
        title: 'Pendaftaran Ditolak',
        message: 'Mohon maaf, pendaftaran Anda belum dapat kami setujui saat ini. Terima kasih telah minat bergabung dengan PijatJogja.'
      },
      {
        type: 'welcome_message',
        title: 'Pesan Selamat Datang',
        message: 'Halo! Terima kasih telah menghubungi PijatJogja. Ada yang bisa kami bantu?'
      }
    ]

    for (const template of whatsappTemplates) {
      const now = new Date()
      await db.execute(
        `INSERT INTO whatsapp_templates (
          id,
          type,
          title,
          message,
          isActive,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          message = VALUES(message),
          isActive = VALUES(isActive),
          updatedAt = VALUES(updatedAt)`,
        [
          randomUUID(),
          template.type,
          template.title,
          template.message,
          1,
          now,
          now,
        ]
      )
    }

    console.log('Website content seeded successfully!')

  } catch (error) {
    console.error('Error seeding content:', error)
  } finally {
    await db.pool.end()
  }
}

seedContent()