# TODO: Fix Contact Data Source Consistency

## Current Task: Make main page dynamically fetch from same data as admin contact page

### Steps:
- [x] Fix table name in `src/app/api/contact/route.ts` from `contact_info` to `contact_infos`
- [x] Test that main page now fetches from correct data source
- [x] Verify admin contact page changes reflect on main page

### Context:
- Admin contact API uses `contact_infos` table
- Public contact API was using `contact_info` (singular) - causing inconsistency
- Main page fetches from public API, so needs to use same table as admin
