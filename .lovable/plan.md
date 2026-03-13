

# AgroTrust MVP Refactor Plan

## Classification Summary

After scanning the full project, here is the classification:

### DELETE
- **Pages**: `Onboarding.tsx` (escrow/delivery messaging), `AdminAnalytics.tsx` (order/revenue analytics)
- **Components**: `reviews/` folder (all 4 files), `home/FlashDeals.tsx` (fake countdown timer), `home/HeroSection.tsx` (unused, BannerCarousel used instead), `home/FeaturedProducts.tsx` (if exists, unused), `home/TrustStats.tsx` (unused), `admin/OrderTrendsChart.tsx`, `admin/RevenueChart.tsx`, `admin/TopProductsChart.tsx`, `admin/CategoryDistributionChart.tsx`, `admin/FarmerPerformanceTable.tsx`
- **Edge Functions**: `calculate-delivery-fee`, `confirm-delivery`, `create-transfer-recipient`, `paystack-initialize`, `paystack-verify`, `paystack-webhook`, `release-escrow`, `send-payout-notification`, `verify-bank-account`
- **Other**: `src/data/mockData.ts` (unused mock data)
- **Types**: `CartItem`, `Order`, `TrackingEvent`, `OrderStatus` from `types/index.ts`; `slug` from `Product` interface

### FIX / REFACTOR
- **types/index.ts**: Remove dead types, remove `rating`/`reviewCount` from Product, add `availability` field
- **ProductDetail.tsx**: Remove reviews section, remove star ratings, remove `slug` reference, add farmer profile page link
- **Products.tsx**: Remove rating sort/filter, add verified-only filter, add availability filter, add search reset button
- **ProductCard.tsx**: Remove star ratings, fix `slug` in URL, add availability badge, add category label
- **JumiaProductCard.tsx**: Remove star ratings, add availability badge
- **BannerCarousel.tsx**: Remove escrow/payment messaging from banners
- **HowItWorks.tsx** → rename to **TrustAndSafety.tsx**: Rewrite as Trust & Safety page (verification process, buyer tips, reporting)
- **HowItWorksSection.tsx**: Rewrite steps for discovery→trust→contact model
- **EscrowExplainer.tsx**: Already updated, keep as-is (no escrow references remain)
- **Onboarding.tsx**: Rewrite with marketplace-appropriate messaging (remove escrow, delivery references)
- **Profile.tsx**: Remove "Shopping Preferences" and "Preferred Delivery State" labels, simplify
- **FarmerDashboard.tsx**: Remove Total Earnings/Pending Payout cards, remove recharts chart, add availability status management
- **FarmerOnboarding.tsx**: Remove bank verification step, remove delivery_areas reference, simplify to 2 steps (details + documents)
- **AddProduct.tsx**: Remove weight_kg field, remove delivery fee helper text, add availability status selector
- **EditProduct.tsx**: Same cleanup as AddProduct
- **AdminDashboard.tsx**: Remove analytics link, add reports inbox link
- **AdminAnalytics.tsx**: Delete entirely (order-based analytics)
- **AdminProducts.tsx**: Works fine, keep
- **AdminUsers.tsx**: Works fine, keep
- **FarmerVerifications.tsx**: Remove `allows_pickup` toggle, otherwise functional
- **Footer.tsx**: Add Trust & Safety link, remove privacy/terms dead links or keep as placeholder
- **JumiaHeader.tsx**: Remove "How It Works" link, add "Trust & Safety" link
- **Layout.tsx**: Keep as-is
- **ConsumerBottomNav.tsx**: Add Browse link
- **FarmerBottomNav.tsx**: Add Dashboard link
- **App.tsx**: Update routes (rename how-it-works to trust-and-safety, remove onboarding if simplified, add farmer profile public page)
- **LocationSelectionModal.tsx**: Remove "delivery" wording
- **LocationBanner.tsx**: Remove "delivery" references

### CREATE
- **FarmerProfile.tsx** (public page): New page at `/farmers/:id` showing farmer details, contact buttons, and their product catalog
- **AdminReports.tsx**: Simple reports inbox for flagged listings/farmers

### DATABASE
- Migration to drop unused tables: `orders`, `order_items`, `order_tracking`, `payouts`, `delivery_zones`, `delivery_areas`, `delivery_pricing`, `cart_items`, `reviews`, `consumer_reviews`
- Remove `total_earnings`, `pending_payout`, `allows_pickup`, `area_id` columns from `farmer_profiles`
- Remove `weight_kg`, `original_price`, `discount_percentage`, `average_rating`, `review_count` columns from `products`
- Add `listing_reports` table for the report/flag system
- Update `farmer_profiles_public` view accordingly

---

## Implementation Plan

### Phase 1: Database Cleanup

**Migration 1 — Drop logistics/order tables:**
```sql
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS delivery_pricing CASCADE;
DROP TABLE IF EXISTS delivery_areas CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS consumer_reviews CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
```

**Migration 2 — Clean farmer_profiles and products:**
```sql
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS total_earnings;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS pending_payout;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS allows_pickup;
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS area_id;

ALTER TABLE products DROP COLUMN IF EXISTS weight_kg;
ALTER TABLE products DROP COLUMN IF EXISTS original_price;
ALTER TABLE products DROP COLUMN IF EXISTS discount_percentage;
ALTER TABLE products DROP COLUMN IF EXISTS average_rating;
ALTER TABLE products DROP COLUMN IF EXISTS review_count;
```

**Migration 3 — Create listing_reports table:**
```sql
CREATE TABLE public.listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  farmer_profile_id uuid REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  reporter_session_id text,
  reporter_user_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
-- Anyone can insert reports
CREATE POLICY "Anyone can submit reports" ON listing_reports FOR INSERT WITH CHECK (true);
-- Only admins can view/update reports
CREATE POLICY "Admins can manage reports" ON listing_reports FOR ALL USING (has_role(auth.uid(), 'admin'));
```

**Migration 4 — Update farmer_profiles_public view:**
Drop and recreate without removed columns.

**Migration 5 — Drop related functions:**
```sql
DROP FUNCTION IF EXISTS check_order_update() CASCADE;
DROP FUNCTION IF EXISTS update_product_rating() CASCADE;
DROP FUNCTION IF EXISTS update_consumer_rating() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_default_address() CASCADE;
```

### Phase 2: Delete Files

Delete these files:
- `src/components/reviews/*` (4 files)
- `src/components/admin/OrderTrendsChart.tsx`
- `src/components/admin/RevenueChart.tsx`
- `src/components/admin/TopProductsChart.tsx`
- `src/components/admin/CategoryDistributionChart.tsx`
- `src/components/admin/FarmerPerformanceTable.tsx`
- `src/components/home/FlashDeals.tsx`
- `src/components/home/HeroSection.tsx`
- `src/components/home/FeaturedProducts.tsx`
- `src/components/home/TrustStats.tsx`
- `src/pages/admin/AdminAnalytics.tsx`
- `src/data/mockData.ts`
- `supabase/functions/calculate-delivery-fee/`
- `supabase/functions/confirm-delivery/`
- `supabase/functions/create-transfer-recipient/`
- `supabase/functions/paystack-initialize/`
- `supabase/functions/paystack-verify/`
- `supabase/functions/paystack-webhook/`
- `supabase/functions/release-escrow/`
- `supabase/functions/send-payout-notification/`
- `supabase/functions/verify-bank-account/`

### Phase 3: Types Cleanup

**`src/types/index.ts`** — Remove `CartItem`, `Order`, `TrackingEvent`, `OrderStatus`, `slug` from Product. Remove `rating`/`reviewCount` from Product. Add availability status type.

### Phase 4: Core Page Rewrites

**`Index.tsx`** — Remove FlashDeals. Keep: LocationBanner, LocationSelectionModal, BannerCarousel, TrustBanner, CategoryGrid, BrowseByStateSection, FeaturedProductsSection (renamed to LatestListings), EscrowExplainer (trust section), BecomeFarmerCTA.

**`Products.tsx`** — Remove rating sort option and rating filter. Add verified-only toggle filter. Add availability filter (In Stock / Limited / Out of Stock). Add search clear button. Remove `slug` from URLs.

**`ProductDetail.tsx`** — Remove ProductReviews import/section. Remove star ratings display. Remove `slug` references. Add link to farmer public profile page. Clean up report section.

**`HowItWorks.tsx` → Trust & Safety page** — Rewrite with: How verification works, buyer safety tips, reporting instructions. Remove all escrow/delivery/order FAQs.

**`Onboarding.tsx`** — Remove escrow and delivery messaging. Update copy to marketplace model.

**`Profile.tsx`** — Change "Shopping Preferences" to "Browse Preferences". Change "Preferred Delivery State" to "Preferred State". Remove "Live Chat" support option.

### Phase 5: Farmer Side Fixes

**`FarmerDashboard.tsx`** — Remove earnings/payout stat cards. Remove recharts import and listing chart. Add product availability quick-update.

**`FarmerOnboarding.tsx`** — Remove bank verification step (step 2). Remove delivery_areas loading. Simplify to: Details → Documents → Review. Keep bank details as optional fields (no verification call).

**`AddProduct.tsx`** — Remove weight_kg field and delivery fee text. Remove original_price/discount fields. Add availability status (In Stock/Limited/Out of Stock).

**`EditProduct.tsx`** — Same cleanup. Add availability status selector.

### Phase 6: Admin Side Fixes

**`AdminDashboard.tsx`** — Remove analytics link. Add "Reports Inbox" stat card and link.

**Create `AdminReports.tsx`** — Simple page showing listing_reports table. Admin can view details, mark resolved, add notes.

**`FarmerVerifications.tsx`** — Remove `allows_pickup` toggle.

**`App.tsx`** — Remove `/admin/analytics` route. Add `/admin/reports` route. Add `/farmers/:id` route (public farmer profile). Rename `/how-it-works` to `/trust-and-safety`. Remove `/onboarding` if simplified into auth flow, or keep with updated copy.

### Phase 7: New Public Farmer Profile Page

**Create `src/pages/FarmerProfile.tsx`** — Public page at `/farmers/:id`:
- Farmer name, farm name, verified badge
- Farm description/story
- Location (State + address)
- Contact buttons: WhatsApp, Call, Email
- Years of experience, farm size
- Date joined
- Full product catalog from this farmer
- Report farmer button

### Phase 8: Component Cleanup

**`ProductCard.tsx`** — Remove star rating. Remove slug from URL. Add availability badge (green/yellow/red). Add category tag.

**`JumiaProductCard.tsx`** — Remove star rating. Add availability badge. Remove discount badge (no more original_price).

**`BannerCarousel.tsx`** — Rewrite banner copy to remove escrow/payment references. Focus on discovery, trust, direct contact.

**`HowItWorksSection.tsx`** — Rewrite 3 steps: Browse Farmers → Verify Trust → Contact Directly.

**`LocationSelectionModal.tsx`** — Change "delivery" to "available near you".

**`LocationBanner.tsx`** — Change "listings" wording (already fine).

**`ConsumerBottomNav.tsx`** — Add Browse (products) link.

**`FarmerBottomNav.tsx`** — Add Dashboard link.

**`JumiaHeader.tsx`** — Change "How It Works" to "Trust & Safety". Update link.

**`Footer.tsx`** — Add Trust & Safety link. Keep structure.

### Phase 9: Edge Function Cleanup

Delete 9 logistics/payment edge functions listed above. Keep: `send-farmer-verification-email`, `send-whatsapp-notification`.

### Phase 10: Final QA Items

- Verify all imports resolve (no broken references to deleted files)
- Verify all routes work
- Verify product CRUD works for farmers
- Verify admin verification queue works
- Verify report submission works
- Verify contact buttons (WhatsApp/Call) work
- Verify no console errors
- Verify mobile responsive layout

---

## Files Summary

| Action | Count | Details |
|--------|-------|---------|
| Delete | ~25 files | Reviews, analytics charts, mock data, edge functions, FlashDeals, HeroSection |
| Create | 2 files | FarmerProfile.tsx, AdminReports.tsx |
| Modify | ~20 files | Types, pages, components, routing |
| DB Migrations | 5 | Drop tables, clean columns, create reports table, update view, drop functions |

