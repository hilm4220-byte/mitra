# 📝 Panduan Konversi Route Handlers

File ini menunjukkan cara mengubah semua route handlers dari MySQL SQL ke Supabase format.

## Perubahan API Database

### 1. Query/SELECT

#### ❌ LAMA (MySQL SQL):
```typescript
const contacts = await db.query(
  'SELECT * FROM contacts WHERE status = 1'
)
```

#### ✅ BARU (Supabase):
```typescript
const contacts = await db.query('contacts', { status: 1 })
```

---

### 2. Insert

#### ❌ LAMA (MySQL SQL):
```typescript
await db.execute(
  `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`,
  ['John', 'john@example.com', 'Hello']
)
```

#### ✅ BARU (Supabase):
```typescript
await db.execute('insert', 'contacts', {
  name: 'John',
  email: 'john@example.com',
  message: 'Hello'
})
```

---

### 3. Update

#### ❌ LAMA (MySQL SQL):
```typescript
await db.execute(
  `UPDATE contacts SET status = 'APPROVED' WHERE id = ?`,
  [contactId]
)
```

#### ✅ BARU (Supabase):
```typescript
await db.execute('update', 'contacts',
  { status: 'APPROVED' },
  { id: contactId }
)
```

---

### 4. Delete

#### ❌ LAMA (MySQL SQL):
```typescript
await db.execute(
  `DELETE FROM contacts WHERE id = ?`,
  [contactId]
)
```

#### ✅ BARU (Supabase):
```typescript
await db.execute('delete', 'contacts', null, { id: contactId })
```

---

### 5. Query dengan Multiple Conditions

#### ❌ LAMA (MySQL SQL):
```typescript
const data = await db.query(
  `SELECT * FROM registrations 
   WHERE status = ? AND gender = ? 
   ORDER BY createdAt DESC
   LIMIT 10`,
  ['PENDING', 'male']
)
```

#### ✅ BARU (Supabase):
```typescript
// Note: Untuk complex queries, gunakan rawQuery dengan SQL langsung
const data = await db.rawQuery(
  `SELECT * FROM registrations 
   WHERE status = $1 AND gender = $2 
   ORDER BY createdAt DESC
   LIMIT 10`,
  ['PENDING', 'male']
)
```

---

## Contoh Konversi File Route Handlers

### Contoh 1: api/contact/route.ts

#### ❌ SEBELUM:
```typescript
import { db } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

type ContactRecord = RowDataPacket & {
  id: string
  type: string
  value: string
  isActive: number
}

export async function GET() {
  const contacts = await db.query<ContactRecord>(
    `SELECT id, type, value FROM contact_infos 
     WHERE isActive = 1 
     ORDER BY FIELD(type, 'address', 'whatsapp', 'email')`
  )
  return Response.json(contacts)
}
```

#### ✅ SESUDAH:
```typescript
import { db } from '@/lib/db'

type ContactRecord = {
  id: string
  type: string
  value: string
  isActive: number
}

export async function GET() {
  const contacts = await db.query<ContactRecord>('contact_infos', { isActive: 1 })
  return Response.json(contacts)
}
```

---

### Contoh 2: api/register/route.ts

#### ❌ SEBELUM:
```typescript
export async function POST(request: Request) {
  const body = await request.json()
  
  const registrationId = randomUUID()
  const now = new Date()

  await db.execute(
    `INSERT INTO therapist_registrations (
      id, fullName, whatsapp, address, gender, experience,
      workArea, availability, message, status, submittedAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      registrationId, body.fullName, body.whatsapp, body.address,
      body.gender, body.experience, body.workArea, body.availability,
      body.message || null, 'PENDING', now, now
    ]
  )

  return Response.json({ success: true, id: registrationId })
}
```

#### ✅ SESUDAH:
```typescript
export async function POST(request: Request) {
  const body = await request.json()
  
  const registrationId = randomUUID()
  const now = new Date()

  const result = await db.execute('insert', 'therapist_registrations', {
    id: registrationId,
    fullName: body.fullName,
    whatsapp: body.whatsapp,
    address: body.address,
    gender: body.gender,
    experience: body.experience,
    workArea: body.workArea,
    availability: body.availability,
    message: body.message || null,
    status: 'PENDING',
    submittedAt: now,
    updatedAt: now
  })

  return Response.json({ success: true, id: registrationId })
}
```

---

## Tabel Perubahan Lengkap

| Operasi | MySQL | Supabase |
|---------|-------|----------|
| **Query All** | `db.query('SELECT * FROM table')` | `db.query('table')` |
| **Query Filter** | `db.query('SELECT * FROM table WHERE col = ?', [val])` | `db.query('table', { col: val })` |
| **Query One** | `db.queryOne('SELECT * FROM table WHERE id = ?', [id])` | `db.queryOne('table', { id })` |
| **Insert** | `db.execute('INSERT INTO table ...')` | `db.execute('insert', 'table', {...})` |
| **Update** | `db.execute('UPDATE table SET ... WHERE id = ?')` | `db.execute('update', 'table', {...}, {id})` |
| **Delete** | `db.execute('DELETE FROM table WHERE id = ?')` | `db.execute('delete', 'table', null, {id})` |
| **Raw SQL** | `db.query('SELECT ... complex query')` | `db.rawQuery('SELECT ... PostgreSQL syntax')` |

---

## Checklist Konversi

Untuk setiap route handler, pastikan:

- [ ] Import dari `'@/lib/db'` sudah correct
- [ ] Hapus `type RowDataPacket` type definitions
- [ ] Convert semua SQL `SELECT` menjadi `db.query()` dengan object filter
- [ ] Convert semua `INSERT` menjadi `db.execute('insert', ...)`
- [ ] Convert semua `UPDATE` menjadi `db.execute('update', ...)`
- [ ] Convert semua `DELETE` menjadi `db.execute('delete', ...)`
- [ ] Test setiap endpoint dengan Postman/Thunder Client
- [ ] Verifikasi data di Supabase Dashboard
