# 🚀 Quick Start - Supabase Integration

Seluruh koneksi database project sudah diintegrasikan ke Supabase. Ikuti langkah-langkah berikut:

## ✅ Langkah 1: Setup Supabase Project

1. Buka https://app.supabase.com
2. Buat project baru (atau gunakan yang sudah ada)
3. Tunggu sampai project selesai setup (±2 menit)

## ✅ Langkah 2: Dapatkan Credentials

Di Supabase Dashboard:
1. Masuk ke **Settings** → **API**
2. Catat 3 value ini:

```
Project URL → Untuk NEXT_PUBLIC_SUPABASE_URL
Anon (public) Key → Untuk NEXT_PUBLIC_SUPABASE_ANON_KEY
Service Role Secret → Untuk SUPABASE_SERVICE_ROLE_KEY
```

## ✅ Langkah 3: Konfigurasi Project

Edit `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

## ✅ Langkah 4: Start Dev Server

```bash
npm run dev
```

## ✅ Langkah 5: Test Connection

Buka browser:
```
http://localhost:3000/test-supabase
```

Seharusnya menampilkan ✅ jika connection berhasil.

---

## 📁 File-file Baru yang Sudah Dibuat

### Core Files:
- **`src/lib/supabase.ts`** - Client Supabase initialization
- **`src/lib/db.ts`** - Database adapter (sudah diupdate)
- **`.env.local`** - Your credentials (JANGAN commit!)
- **`.env.example`** - Template untuk credentials

### Documentation:
- **`SUPABASE_SETUP.md`** - Setup lengkap & migration guide
- **`ROUTE_CONVERSION_GUIDE.md`** - Cara konversi route handlers
- **`src/lib/supabase-debug.ts`** - Helper untuk debugging
- **`src/app/test-supabase/page.tsx`** - Test page untuk verify connection

---

## 🔄 Perubahan API Database

### Query
```typescript
// Lama
await db.query('SELECT * FROM contacts WHERE status = 1')

// Baru
await db.query('contacts', { status: 1 })
```

### Insert
```typescript
// Lama
await db.execute('INSERT INTO contacts (name) VALUES (?)', ['John'])

// Baru
await db.execute('insert', 'contacts', { name: 'John' })
```

### Update
```typescript
// Lama
await db.execute('UPDATE contacts SET status = 1 WHERE id = 5')

// Baru
await db.execute('update', 'contacts', { status: 1 }, { id: 5 })
```

### Delete
```typescript
// Lama
await db.execute('DELETE FROM contacts WHERE id = 5')

// Baru
await db.execute('delete', 'contacts', null, { id: 5 })
```

---

## 📝 Next Steps

1. ✅ Update `.env.local` dengan credentials Supabase Anda
2. ✅ Test connection di `/test-supabase`
3. ✅ Migrate data dari MySQL ke Supabase (lihat `SUPABASE_SETUP.md`)
4. ✅ Update route handlers (lihat `ROUTE_CONVERSION_GUIDE.md`)
5. ✅ Test setiap API endpoint

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Local Setup Guide](SUPABASE_SETUP.md)
- [Route Conversion Guide](ROUTE_CONVERSION_GUIDE.md)

---

## ⚠️ Important Security Notes

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Safe to expose (public)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe to expose (limited permissions)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - NEVER expose! Server-only!
- 🔒 `.env.local` adalah private, sudah di-gitignore

---

## ❓ Troubleshooting

**Q: Connection error?**
A: Verifikasi credentials di `.env.local` sudah benar, restart dev server

**Q: Data tidak muncul?**
A: Check table names di Supabase Dashboard, pastikan sama dengan code

**Q: Butuh help dengan API?**
A: Lihat `ROUTE_CONVERSION_GUIDE.md` untuk contoh-contoh

---

Created: December 2, 2025
Supabase Package: @supabase/supabase-js ^1.x
Next.js Version: 15.3.5
