

# Root Cause: Missing Table-Level Grants

## The Bug

**Every table in the project has ZERO grants** to the `anon` and `authenticated` PostgreSQL roles. The RLS policies are correct, but they never get evaluated because the roles lack basic `SELECT`/`INSERT`/`UPDATE`/`DELETE` privileges on the tables themselves.

In Supabase, the frontend client connects as `anon` (logged out) or `authenticated` (logged in). Without `GRANT` statements, these roles cannot access any table — RLS policies are irrelevant if the role has no table-level permission in the first place.

The `service_role` (used by admin tools and the read_query tool) bypasses RLS entirely, which is why data appeared accessible during development/admin testing.

## Why Admin Could See Products

If the admin was testing via the Supabase dashboard or any service-role connection, they'd see everything. From the actual frontend, even admin would fail — but the perception was "admin only" because that's the only context where data was ever visible.

## Fix: One Migration

A single migration grants the correct table-level privileges to `anon` and `authenticated` on all 5 tables plus the view. RLS policies (which are already correct and PERMISSIVE) will then properly control row-level access.

### Grant Matrix

| Table | anon | authenticated |
|---|---|---|
| `products` | SELECT | SELECT, INSERT, UPDATE, DELETE |
| `farmer_profiles` | — | SELECT, INSERT, UPDATE |
| `farmer_profiles_public` (view) | SELECT | SELECT |
| `profiles` | — | SELECT, INSERT, UPDATE |
| `user_roles` | — | SELECT, INSERT |
| `listing_reports` | INSERT | SELECT, INSERT |
| `session_logs` (if exists) | INSERT | INSERT |

Key decisions:
- `anon` gets SELECT on `products` (public marketplace browsing) and `farmer_profiles_public` view (public farmer directory)
- `anon` gets INSERT on `listing_reports` (anyone can report)
- `authenticated` gets full CRUD on `products` (controlled by RLS to own products only)
- `farmer_profiles` base table: no `anon` access (sensitive docs); `authenticated` gets SELECT/INSERT/UPDATE (RLS restricts to own profile + admin)
- `profiles`: authenticated only (RLS restricts to own profile)

### Final Visibility Rule

**A product is publicly visible if `is_active = true` AND the farmer's `verification_status = 'approved'`** — enforced by the existing RLS policy "Anyone can view active products from verified farmers."

### No Frontend Changes Needed

The frontend queries are correct. They query `products` with `is_active = true` and join against `farmer_profiles_public`. Once grants are in place, these queries will return data for all roles.

