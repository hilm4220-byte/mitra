import { Suspense } from 'react'

async function TestConnection() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!URL || !ANON_KEY) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
        ❌ Missing environment variables:
        <ul className="list-disc ml-5 mt-2">
          {!URL && <li>NEXT_PUBLIC_SUPABASE_URL</li>}
          {!ANON_KEY && <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>}
        </ul>
        <p className="mt-2 text-sm">Check your .env.local file</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
      <p>✅ Environment variables loaded successfully!</p>
      <p className="text-sm mt-2">
        <strong>URL:</strong> {URL.substring(0, 20)}...
      </p>
    </div>
  )
}

export default function SupabaseTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Supabase Test Page</h1>
        <p className="text-slate-600 mb-8">Verify your Supabase connection setup</p>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Connection Status */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Connection Status</h2>
            <Suspense fallback={<div className="animate-pulse h-12 bg-slate-200 rounded" />}>
              <TestConnection />
            </Suspense>
          </div>

          {/* Environment Info */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Info</h2>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-blue-700 text-sm space-y-2">
              <p>• This is a test page to verify Supabase setup</p>
              <p>• You can delete this page once you confirm connection is working</p>
              <p>• Located at: <code className="bg-white px-2 py-1 rounded">src/app/api/test-supabase/page.tsx</code></p>
              <p>• Access it via: <code className="bg-white px-2 py-1 rounded">/api/test-supabase</code></p>
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Setup</h2>
            <ol className="bg-slate-50 border border-slate-200 rounded p-4 text-slate-700 text-sm space-y-2">
              <li>1. Create a project at <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.supabase.com</a></li>
              <li>2. Go to Settings → API</li>
              <li>3. Copy <strong>Project URL</strong> and <strong>Anon Key</strong></li>
              <li>4. Update <code className="bg-white px-2 py-1 rounded">.env.local</code> with your credentials</li>
              <li>5. Restart dev server: <code className="bg-white px-2 py-1 rounded">npm run dev</code></li>
            </ol>
          </div>

          {/* Documentation Links */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Documentation</h2>
            <div className="space-y-2">
              <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                📚 Supabase Documentation
              </a>
              <a href="/SUPABASE_SETUP.md" className="block text-blue-600 hover:underline">
                📝 Local Setup Guide (SUPABASE_SETUP.md)
              </a>
              <a href="/ROUTE_CONVERSION_GUIDE.md" className="block text-blue-600 hover:underline">
                🔄 Route Conversion Guide (ROUTE_CONVERSION_GUIDE.md)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
