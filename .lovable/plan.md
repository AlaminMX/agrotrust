

# AgroTrust Functional + UX Improvement Plan

This is a focused pass on top of the current design — no redesign, just targeted fixes and features across 20 items.

---

## Phase 1: Database Schema Changes (Migration)

**New tables:**
- `platform_states` — admin-manageable states table with columns: `id`, `value` (slug), `label`, `is_active`, `sort_order`, `created_at`
- `platform_areas` — admin-manageable areas with columns: `id`, `state_value` (FK to platform_states.value), `name`, `created_at`
- `admin_notifications` — for tracking new user/farmer signups: `id`, `type` (enum: 'new_user', 'new_farmer'), `user_id`, `metadata` (jsonb), `is_read`, `created_at`

**Seed data:** Insert current hardcoded states (abuja, kaduna, bauchi, kano) and areas from `nigerianAreas.ts` into the new tables.

**Triggers:**
- On `profiles` INSERT → insert `admin_notifications` row (type='new_user')
- On `farmer_profiles` INSERT → insert `admin_notifications` row (type='new_farmer')

**RLS policies:**
- `platform_states` / `platform_areas`: SELECT for anon+authenticated; INSERT/UPDATE/DELETE for admin only
- `admin_notifications`: SELECT/UPDATE for admin only

**Grants:** appropriate SELECT/INSERT/UPDATE/DELETE for anon and authenticated on new tables.

**View update:** Recreate `farmer_profiles_public` to include the `area` column (verify it's already there from previous migration).

**Edge function for user deletion:** Create `delete-user` edge function that uses `supabase.auth.admin.deleteUser()` with service_role key — this is the only way to truly delete a user from auth. The function accepts `user_id`, deletes from auth (which cascades to profiles via FK), and returns success.

---

## Phase 2: Image Cropping (Item 1)

**New dependency:** Install `react-cropper` + `cropperjs` (or use a lighter approach with canvas-based cropping).

**New component:** `src/components/ui/ImageCropper.tsx`
- Modal/dialog-based cropper
- Accepts image file, returns cropped blob
- Aspect ratio configurable (default 4:3 for products)
- Mobile-friendly with touch support
- Compress output to <1MB using canvas `toBlob` with quality parameter

**Update:** `AddProduct.tsx` and `EditProduct.tsx` — after file selection, open cropper dialog. On confirm, set cropped file as the product image.

---

## Phase 3: Expanded Unit Options (Item 2)

**Update `src/types/index.ts`:** Add a `UNITS` constant array:
```typescript
export const UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'ton', label: 'Ton' },
  { value: 'bag', label: 'Bag' },
  { value: 'basket', label: 'Basket' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'crate', label: 'Crate' },
  { value: 'paint_bucket', label: 'Paint Bucket' },
  { value: 'tuber', label: 'Tuber' },
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'tray', label: 'Tray' },
  { value: 'carton', label: 'Carton' },
  { value: 'litre', label: 'Litre' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'mudu', label: 'Mudu' },
  { value: 'derica', label: 'Derica' },
  { value: 'custom', label: 'Custom Unit' },
];
```

**Update:** `AddProduct.tsx`, `EditProduct.tsx` — use `UNITS` array for the select. When "custom" is selected, show a text input for the custom unit name. Store the custom unit text as the unit value.

**Display:** Product cards, detail pages, farmer dashboard already display `product.unit` dynamically — just ensure custom units display properly.

---

## Phase 4: Admin User Delete Fix (Item 3)

**Root cause:** The current `deleteUser` in `AdminUsers.tsx` only deletes from `profiles`, `user_roles`, and `farmer_profiles` tables — but does NOT delete the user from `auth.users`. Since `handle_new_user` trigger fires on auth signup, the auth user still exists and profile rows get recreated on next login.

**Fix:** Create edge function `supabase/functions/delete-user/index.ts` that:
1. Validates caller is admin (check JWT for admin role)
2. Calls `supabase.auth.admin.deleteUser(userId)`
3. The cascading FK `ON DELETE CASCADE` on profiles/farmer_profiles/user_roles handles cleanup

**Update `AdminUsers.tsx`:** Call the edge function instead of manual table deletes:
```typescript
const { error } = await supabase.functions.invoke('delete-user', { body: { user_id: userId } });
```

---

## Phase 5: Sign-In Error Message (Item 4)

**Update `Auth.tsx`:** The login error handler already maps 'Invalid login credentials' — just improve the message to be more user-friendly: "Incorrect email or password. Please try again." Also handle 'Email not confirmed' case separately.

---

## Phase 6: Admin Manages States & Areas (Items 5, 19)

**New page:** `src/pages/admin/AdminLocations.tsx`
- Two-panel layout: States list on left, Areas for selected state on right
- Add state: form with value (slug) and label
- Remove state: delete button with confirmation
- Add area: text input under selected state
- Remove area: delete button

**Add route:** `/admin/locations` in `App.tsx`

**Update consuming code:** Replace hardcoded `STATES` from `types/index.ts` with a hook `useStates()` that fetches from `platform_states` table. Fallback to hardcoded if fetch fails.

**Update `nigerianAreas.ts`:** Replace `AREA_SUGGESTIONS` with a hook `useAreaSuggestions(state)` that queries `platform_areas`.

**Files affected:** `types/index.ts` (keep STATES as fallback), new `src/hooks/useStates.ts`, new `src/hooks/useAreaSuggestions.ts`, `AreaInput.tsx`, `FarmerOnboarding.tsx`, `Products.tsx`, `JumiaHeader.tsx`, `Profile.tsx`, `StateBanner.tsx`, `HeroSection.tsx`, `Index.tsx`, `AdminDashboard.tsx`.

---

## Phase 7: Remove Contact Visibility Toggle (Item 6)

**Update `FarmerOnboarding.tsx`:** Remove the `contactVisibilityConsent` state and the checkbox at line 231-233. Remove it from the validation check at line 237.

Contacts are always public — no toggle needed.

---

## Phase 8: Farmer Contact Fields (Items 7, 14, 15)

**Update `FarmerOnboarding.tsx`:** Add email field in the Contact Information section. Currently has WhatsApp + Secondary Phone. Add a "Call Phone Number" field (rename "Secondary Phone" to "Call Number") and add "Email Address" field.

**Update `farmer_profiles` table:** Add `email` column (text, nullable) via migration.

**Update `farmer_profiles_public` view:** Include `email` column.

**Update `FarmerDashboard.tsx` profile tab:** Show contact fields and allow editing (WhatsApp, Call Number, Email). Add an "Edit Contact Info" section with save functionality.

**Update `FarmerProfile.tsx` and `ProductDetail.tsx`:** Ensure all three contact methods (WhatsApp, Call, Email) are displayed from farmer data.

---

## Phase 9: Phone Number Normalization (Item 9)

**New utility:** `src/lib/phone.ts`
```typescript
export const normalizeNigerianPhone = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+234')) return cleaned;
  if (cleaned.startsWith('234')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+234' + cleaned.slice(1);
  return '+234' + cleaned;
};
```

**Apply in:**
- `FarmerOnboarding.tsx` — normalize before saving
- `FarmerDashboard.tsx` — normalize on edit save
- `FarmerProfile.tsx` — normalize for WhatsApp/call links
- `ProductDetail.tsx` — normalize for WhatsApp/call links

---

## Phase 10: WhatsApp Pre-Written Message (Item 13)

**Update `ProductDetail.tsx`:** The WhatsApp link already has a message but it's generic. Make it product-specific:
```
`Hi, I saw your "${product.name}" listing on AgroTrust and I'd like to make an inquiry. Is it still available?`
```

**Update `FarmerProfile.tsx`:** Keep the generic farm inquiry message as-is (no specific product context there).

---

## Phase 11: Admin Notifications Page (Item 10)

**New page:** `src/pages/admin/AdminNotifications.tsx`
- List of recent signups (users and farmers)
- Each item shows: name, email, type (Consumer/Farmer), timestamp
- Mark as read functionality
- Filter by type (all/users/farmers)

**Add route:** `/admin/notifications` in `App.tsx`
**Update `AdminDashboard.tsx`:** Add notifications card/link.

---

## Phase 12: Farmer Verification Review Improvements (Items 11, 12)

**Update `FarmerVerifications.tsx`:**
- In the detail dialog, show farmer's state label AND area clearly (line 147 currently shows raw state value — format with `formatLocation`)
- Fix reject: The `handleUpdateStatus` function looks correct syntactically. The issue is likely RLS — the `check_farmer_profile_update` trigger prevents non-admins from changing verification fields, but the update uses the admin's session. Need to investigate if the `verification_status` enum type includes 'rejected'. Check if the enum `verification_status` has 'rejected' as a valid value. If not, add it via migration.

---

## Phase 13: Dashboard Bottom Navigation (Item 16)

**Update `Layout.tsx`:** Currently `FarmerDashboard.tsx` doesn't use `<Layout>` — it has its own header. Two options:
1. Wrap farmer dashboard pages in Layout (adds bottom nav automatically)
2. Add FarmerBottomNav directly to FarmerDashboard, AddProduct, EditProduct

**Approach:** Add `<FarmerBottomNav />` import and render to `FarmerDashboard.tsx`, `AddProduct.tsx`, and `EditProduct.tsx` at the bottom, plus add `pb-16 lg:pb-0` to the main container.

---

## Phase 14: State-Based Discovery (Items 17, 18, 20)

**Update `Index.tsx`:** Add a new `StateBrowseSection` component between CategoryGrid and FeaturedFarmers. Shows available states as browseable cards linking to `/products/{state}`.

**New component:** `src/components/home/StateBrowseSection.tsx`
- Grid of state cards (fetch from `platform_states`)
- Each card shows state name + product count
- Links to `/products/{stateValue}`

**Update `CartContext.tsx`:** For logged-in users, check `preferred_state` from profile. If set and matches an available state, use it as default. For logged-out users, default to 'all'.

**Update `useAuth` or create new hook:** On auth state change, fetch user's preferred_state and set in location context.

---

## Files Summary

| Action | Files |
|--------|-------|
| **DB Migration** | 1 large migration (new tables, triggers, grants, email column, enum check) |
| **Edge Function** | `supabase/functions/delete-user/index.ts` |
| **New Components** | `ImageCropper.tsx`, `AdminLocations.tsx`, `AdminNotifications.tsx`, `StateBrowseSection.tsx` |
| **New Hooks** | `useStates.ts`, `useAreaSuggestions.ts` |
| **New Utilities** | `src/lib/phone.ts` |
| **Updated** | `types/index.ts`, `AddProduct.tsx`, `EditProduct.tsx`, `FarmerOnboarding.tsx`, `FarmerDashboard.tsx`, `AdminUsers.tsx`, `FarmerVerifications.tsx`, `Auth.tsx`, `FarmerProfile.tsx`, `ProductDetail.tsx`, `Index.tsx`, `App.tsx`, `CartContext.tsx`, `Layout.tsx`, `AdminDashboard.tsx`, `AreaInput.tsx`, `Products.tsx`, `JumiaHeader.tsx`, `Profile.tsx`, `StateBanner.tsx`, `HeroSection.tsx` |

---

## Implementation Order

1. DB migration + edge function (foundational)
2. Phone normalization utility + UNITS constant (small, no deps)
3. Auth error message fix (quick)
4. Remove contact toggle + add contact fields (quick)
5. Admin user delete fix (edge function)
6. Image cropper component + integrate
7. Expanded units in forms
8. Admin locations page + hooks to replace hardcoded states
9. Admin notifications page
10. Farmer verification review improvements + reject fix
11. Dashboard bottom nav
12. State-based discovery on homepage
13. Default state logic for visitors vs users
14. WhatsApp pre-written messages
15. Ensure contacts shown everywhere

