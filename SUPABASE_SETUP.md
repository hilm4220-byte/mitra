# 📚 Panduan Setup Supabase

## 1. Setup Supabase Project

### Langkah 1: Buat Project di Supabase
1. Buka [app.supabase.com](https://app.supabase.com/)
2. Login atau buat akun baru
3. Klik "New Project"
4. Isi detail project:
   - **Project name**: Misal "mitra-jogja"
   - **Database password**: Buat password yang kuat
   - **Region**: Pilih region terdekat (Asia Tenggara)
5. Klik "Create new project" dan tunggu 1-2 menit

### Langkah 2: Dapatkan Credentials
Setelah project dibuat, buka "Settings" → "API" di sidebar

Catat 3 informasi penting:
- **Project URL** → Gunakan untuk `NEXT_PUBLIC_SUPABASE_URL`
- **Anon (public) Key** → Gunakan untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Secret** → Gunakan untuk `SUPABASE_SERVICE_ROLE_KEY`

## 2. Konfigurasi di Project

### Langkah 1: Update `.env.local`
Edit file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Langkah 2: Verifikasi Koneksi
Jalankan development server:
```bash
npm run dev
```

## 3. Migrate Data dari MySQL ke Supabase

### Opsi 1: Gunakan Supabase Migration Tools
Supabase menyediakan tools untuk migrate dari MySQL:

1. Di Supabase Dashboard → "Migration"
2. Pilih "From MySQL"
3. Ikuti step-by-step untuk connect ke MySQL database lama
4. Pilih table yang ingin di-migrate
5. Klik "Start Migration"

### Opsi 2: Manual Migration
Jika automatic migration tidak bekerja:

1. Export data MySQL:
```bash
mysqldump -u root -p mitrajogja > backup.sql
```

2. Edit `backup.sql` dan sesuaikan dengan PostgreSQL syntax
3. Import ke Supabase via SQL Editor:
   - Buka Supabase Dashboard → "SQL Editor"
   - Paste konten `backup.sql` yang sudah di-edit
   - Klik "Run"

## 4. Update API Routes

### Contoh: Menggunakan DB dengan Supabase

**Sebelum (MySQL):**
```typescript
import { db } from '@/lib/db'

// Query
const users = await db.query('SELECT * FROM users WHERE role = ?', ['admin'])

// Insert
const result = await db.execute('INSERT INTO users (name, email) VALUES (?, ?)', ['John', 'john@example.com'])
```

**Sesudah (Supabase):**
```typescript
import { db } from '@/lib/db'

// Query dengan filter
const users = await db.query('users', { role: 'admin' })

// Insert
const result = await db.execute('insert', 'users', { name: 'John', email: 'john@example.com' })
```

### Update Syntax di Route Handlers
Semua route handler yang menggunakan `db.query()` perlu di-update untuk menggunakan format Supabase.

#### Contoh Konversi:

**route.ts sebelum (MySQL SQL):**
```typescript
export async function GET(req: Request) {
  const contacts = await db.query(
    'SELECT id, name, email FROM contacts ORDER BY created_at DESC'
  )
  return Response.json(contacts)
}

export async function POST(req: Request) {
  const body = await req.json()
  const result = await db.execute(
    'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
    [body.name, body.email, body.message]
  )
  return Response.json(result)
}
```

**route.ts sesudah (Supabase):**
```typescript
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const contacts = await db.query('contacts')
  return Response.json(contacts)
}

export async function POST(req: Request) {
  const body = await req.json()
  const result = await db.execute('insert', 'contacts', {
    name: body.name,
    email: body.email,
    message: body.message
  })
  return Response.json(result)
}
```

## 5. Struktur Query Supabase di Project Ini

### Query (SELECT)
```typescript
// Semua data
const allData = await db.query('table_name')

// Dengan filter
const filtered = await db.query('table_name', { column: 'value' })

// Single row
const single = await db.queryOne('table_name', { id: 1 })
```

### Insert
```typescript
const result = await db.execute('insert', 'table_name', {
  column1: 'value1',
  column2: 'value2'
})
```

### Update
```typescript
const result = await db.execute('update', 'table_name', 
  { name: 'new name' },
  { id: 1 }
)
```

### Delete
```typescript
const result = await db.execute('delete', 'table_name', 
  null,
  { id: 1 }
)
```

## 6. Keamanan

⚠️ **IMPORTANT:**

1. **NEXT_PUBLIC_* variables**: Aman, akan terlihat di frontend
2. **SUPABASE_SERVICE_ROLE_KEY**: ⛔ JANGAN expose ke frontend, hanya untuk server
3. Jangan commit `.env.local` ke git
4. `.env.local` sudah di-add ke `.gitignore`

## 7. Troubleshooting

### Error: "Missing Supabase credentials"
- Pastikan `.env.local` sudah di-setup dengan benar
- Restart development server setelah update `.env.local`

### Connection Error
- Verifikasi URL dan key sudah benar
- Periksa CORS settings di Supabase Dashboard
- Pastikan project Supabase sudah aktif

### Data tidak ter-migrate
- Verifikasi struktur table di Supabase sama dengan MySQL
- Gunakan Supabase SQL Editor untuk debug queries

## 8. Support

Dokumentasi Supabase: https://supabase.com/docs
Support Chat: https://supabase.com/support
