

# AgroTrust Full UI/UX Redesign + Location System

## Scope

This is a comprehensive redesign touching ~25 files: new visual system, specific area-based location, modern trust-first UX, and cleanup.

---

## Phase 1: Database — Add `area` Field

**Migration:** Add `area` text column to `farmer_profiles` and `products` tables, plus update the `farmer_profiles_public` view.

```sql
ALTER TABLE farmer_profiles ADD COLUMN area text;
ALTER TABLE products ADD COLUMN area text;
-- Recreate farmer_profiles_public view to include area
```

This enables the "State, Area" location format (e.g., "Abuja, Gwarimpa").

---

## Phase 2: Design System Refresh

**`src/index.css`** — Refresh CSS variables for a cleaner, warmer palette:
- Lighter, warmer backgrounds (warm off-white instead of gray)
- Slightly brighter green primary for better trust signaling
- Better contrast ratios
- Add utility classes for trust badges, location pills, availability chips

**`tailwind.config.ts`** — No structural changes needed, tokens already map well.

---

## Phase 3: Location System

### Area Suggestions Data
**Create `src/data/nigerianAreas.ts`** — A mapping of state → common areas for autocomplete:
```typescript
export const AREA_SUGGESTIONS: Record<string, string[]> = {
  abuja: ['Gwarimpa', 'Wuse', 'Maitama', 'Garki', 'Asokoro', 'Kubwa', ...],
  kaduna: ['Kabala', 'Barnawa', 'Sabon Tasha', 'Tudun Wada', ...],
  kano: ['Sabon Gari', 'Nassarawa', 'Fagge', ...],
  bauchi: ['Bauchi Central', 'Yelwa', ...],
};
```

### Location Display Helper
**Create `src/lib/location.ts`** — Utility to format location consistently:
```typescript
export const formatLocation = (state: string, area?: string | null): string => {
  const stateLabel = STATES.find(s => s.value === state)?.label || state;
  return area ? `${stateLabel}, ${area}` : stateLabel;
};
```

### Area Input Component
**Create `src/components/ui/AreaInput.tsx`** — Autocomplete text input that filters suggestions as user types, with free-text fallback.

---

## Phase 4: Homepage Redesign

**`src/pages/Index.tsx`** — Reorder and restructure sections:
1. Hero (new) — Trust-focused headline with search CTA
2. TrustBanner (refined)
3. CategoryGrid (refined with better cards)
4. Featured Verified Farmers (new section)
5. FeaturedProductsSection (refined)
6. HowItWorksSection (refined)
7. BecomeFarmerCTA (refined)

Remove: LocationBanner and LocationSelectionModal from homepage (move location selection into header/browse page only — less intrusive).

### New/Updated Home Components

**`src/components/home/HeroSection.tsx`** (new) — Clean hero with:
- Trust headline: "Fresh Produce from Verified Nigerian Farmers"
- Subtitle: "Browse local produce. Contact farmers directly. No middlemen."
- Search bar + Browse CTA
- Subtle background pattern or gradient, no stock photo carousel

**`src/components/home/FeaturedFarmersSection.tsx`** (new) — Horizontal scroll of verified farmer cards showing farm name, state+area, verified badge, product count.

**`src/components/home/CategoryGrid.tsx`** — Redesign with cleaner rounded cards, subtle icons, better spacing.

**`src/components/home/TrustBanner.tsx`** — Tighter design with icon-stat pairs in a single row.

**`src/components/home/HowItWorksSection.tsx`** — Numbered steps with connecting lines, cleaner typography.

**`src/components/home/FeaturedProductsSection.tsx`** — Better grid, remove tab system, show 8 latest products.

**`src/components/home/BecomeFarmerCTA.tsx`** — Simplify, warmer tone.

**Delete:** `BannerCarousel.tsx` (replaced by HeroSection), `EscrowExplainer.tsx` (redundant with HowItWorks), `BrowseByStateSection.tsx` (integrated into hero/browse), `LocationBanner.tsx`, `LocationSelectionModal.tsx` (location now lives in header).

---

## Phase 5: Header Redesign

**`src/components/layout/JumiaHeader.tsx`** — Cleaner, more modern header:
- Top bar: location selector (state, area) + Trust & Safety link
- Main bar: Logo + search + account dropdown
- Category nav bar on desktop remains
- Location in header shows "State, Area" format
- Remove the forced location modal — use a gentler inline prompt on first visit

---

## Phase 6: Product Card Redesign

**`src/components/products/ProductCard.tsx`** — Premium but practical redesign:
- Clean image with subtle rounded corners
- Verified badge (shield style) top-left
- Availability chip top-right
- Product name + category tag
- Price + unit
- Location pill: "Kaduna, Kabala" with MapPin icon
- Farm name
- "View Farmer" or "Contact" CTA button
- Better hover state

**`src/components/products/JumiaProductCard.tsx`** — Same treatment, compact variant for grids.

---

## Phase 7: Browse/Marketplace Page

**`src/pages/Products.tsx`** — Cleaner layout:
- Search bar with location indicator
- Horizontal filter chips (categories, verified-only, availability)
- Sidebar filters on desktop (price range, verified toggle)
- Product grid with consistent cards
- State selector integrated into page header (not a separate banner)
- Remove `StateBanner.tsx` delivery language — replace with clean location header

**`src/components/products/StateBanner.tsx`** — Rewrite: remove "delivery" wording, clean location display with area.

**`src/components/products/ProductFilters.tsx`** — Keep structure, refine visuals.

---

## Phase 8: Product Detail Page

**`src/pages/ProductDetail.tsx`** — Refined layout:
- Location displays as "State, Area"
- Farmer section shows location pill
- WhatsApp button more prominent (green, larger)
- Cleaner information hierarchy

---

## Phase 9: Farmer Profile Page

**`src/pages/FarmerProfile.tsx`** — Redesign as a proper seller profile:
- Large header with farm icon/avatar, farm name, verified badge
- Location: "State, Area" prominently displayed
- About section
- Contact buttons row: WhatsApp (primary green), Call, Email
- Product catalog grid below
- Trust reminder
- Report button

---

## Phase 10: Farmer Registration + Dashboard

**`src/pages/farmer/FarmerOnboarding.tsx`** — Add area field with autocomplete:
- In the "details" step, after State dropdown, add "Area / Local Area" field with AreaInput component
- Group fields into clear sections: Personal Info, Farm Info, Location, Verification Uploads
- Cleaner form styling

**`src/pages/farmer/FarmerDashboard.tsx`** — Show area in profile tab, cleaner stat cards.

**`src/pages/farmer/AddProduct.tsx`** — Add area field (auto-populated from farmer profile, editable).

**`src/pages/farmer/EditProduct.tsx`** — Same area field addition.

---

## Phase 11: Other Pages

**`src/pages/Profile.tsx`** — Minor cleanup, show preferred area.

**`src/components/layout/Footer.tsx`** — Cleaner, add trust language.

**`src/components/layout/ConsumerBottomNav.tsx`** — Keep, no bottom nav for logged-out users (already handled).

**`src/components/layout/FarmerBottomNav.tsx`** — Keep.

**`src/context/CartContext.tsx`** — Rename to `LocationContext.tsx` and export as `useLocation` (keep `useCart` as alias for backward compat).

---

## Phase 12: Admin Cleanup

**Admin pages** — Light visual refinements only:
- `FarmerVerifications.tsx`: Show area in farmer details
- `AdminProducts.tsx`: Show area in product table
- Remove "delivery" language from `StateBanner.tsx`

---

## Phase 13: Cleanup

- Delete `supabase/functions/calculate-delivery-fee/` (confirmed it doesn't exist already — was previously deleted)
- Remove `StateBanner` delivery/checkout language
- Rename `CartProvider`/`useCart` exports to `LocationProvider`/`useLocation`

---

## Files Summary

| Action | Files |
|--------|-------|
| **DB Migration** | 1 migration (add `area` to farmer_profiles, products; update view) |
| **Create** | `src/data/nigerianAreas.ts`, `src/lib/location.ts`, `src/components/ui/AreaInput.tsx`, `src/components/home/HeroSection.tsx`, `src/components/home/FeaturedFarmersSection.tsx` |
| **Major Rewrite** | `Index.tsx`, `Products.tsx`, `ProductDetail.tsx`, `FarmerProfile.tsx`, `FarmerOnboarding.tsx`, `ProductCard.tsx`, `JumiaProductCard.tsx`, `JumiaHeader.tsx`, `StateBanner.tsx` |
| **Moderate Update** | `index.css`, `FarmerDashboard.tsx`, `AddProduct.tsx`, `EditProduct.tsx`, `Footer.tsx`, `CategoryGrid.tsx`, `TrustBanner.tsx`, `HowItWorksSection.tsx`, `BecomeFarmerCTA.tsx`, `FeaturedProductsSection.tsx`, `types/index.ts`, `CartContext.tsx`, `Layout.tsx`, `ProductFilters.tsx`, `Profile.tsx` |
| **Delete** | `BannerCarousel.tsx`, `EscrowExplainer.tsx`, `BrowseByStateSection.tsx`, `LocationBanner.tsx`, `LocationSelectionModal.tsx` |
| **Admin (light)** | `FarmerVerifications.tsx`, `AdminProducts.tsx` |

