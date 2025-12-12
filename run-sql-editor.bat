@echo off
echo Setting up environment variables for SQL Editor...

set NEXT_PUBLIC_SUPABASE_URL=https://jbycypljytjeihlzzdra.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieWN5cGxqeXRqZWlobHp6ZHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2MjIzOCwiZXhwIjoyMDgwMjM4MjM4fQ.6viFFYaWRRvxmdNuKu0d-xq6TbsbpP-N9moYtgAgDYs

echo Running SQL Editor script...
npx ts-node scripts/sql-editor.ts

echo.
echo SQL Editor execution completed.
pause
