

# Fix: Products and Farmers Not Visible to Public Users

## Root Cause
The `farmer_profiles_public` view has `security_invoker=true`, so queries execute with the caller's permissions. The base `farmer_profiles` table has NO public SELECT policy — only admins and the owning farmer can read it. Result: anon users and regular consumers get `[]` from the view, and since the product display code cross-references farmers, no products show either.

## Fix
**One database migration** to recreate the view WITHOUT `security_invoker`, so it runs as the definer (superuser) and bypasses RLS on the base table. The view already excludes sensitive columns (id_document_url, farm_registration_url, certification_urls, verification_notes), so this is safe. The base table retains its restrictive RLS.

```sql
DROP VIEW IF EXISTS farmer_profiles_public;
CREATE VIEW farmer_profiles_public AS
  SELECT id, user_id, farm_name, farm_description, state, address, area,
         farm_size, produce_types, whatsapp_phone, secondary_phone, email,
         verification_status, verified_at, created_at, updated_at, years_of_experience
  FROM farmer_profiles
  WHERE verification_status = 'approved';
```

Key changes:
- No `security_invoker` — view runs as definer, bypassing base table RLS
- Added `WHERE verification_status = 'approved'` filter directly in the view so only approved farmers are ever exposed publicly
- Same column list (no sensitive docs exposed)

**Also grant SELECT on the view to anon and authenticated:**
```sql
GRANT SELECT ON farmer_profiles_public TO anon, authenticated;
```

No code changes needed — the frontend already queries this view correctly.

### Files
- 1 new database migration

