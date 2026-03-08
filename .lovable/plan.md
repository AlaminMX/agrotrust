
# Plan: Enforce State Selection + Enable State Editing in Dashboard

## Current State
- **Onboarding**: State is already required (line 238 validates `!state`). Good.
- **Dashboard Profile tab**: Shows state/area as read-only text. No way to edit it.
- **Dashboard Contact tab**: Has edit functionality for phone/email but not for location.

## Changes

### 1. `src/pages/farmer/FarmerDashboard.tsx` — Add location editing to Profile tab

Add state and area editing capability alongside the existing profile display:
- Add state/area edit state variables (`editingProfile`, `editState`, `editArea`)
- Add an "Edit Location" button in the Profile tab
- When editing, show a State dropdown (using `useStates()` hook) and AreaInput component
- Save updates to `farmer_profiles` table via supabase
- After save, also update all the farmer's existing products' `state` and `area` columns to match (since products inherit farmer location)
- Import `useStates`, `AreaInput`, `Select` components

### 2. No database changes needed
- `farmer_profiles.state` is already `NOT NULL` — state is mandatory at DB level
- Products already have a `set_product_state` trigger that auto-fills state/area from farmer profile on INSERT, but existing products won't auto-update when farmer changes state — so the dashboard save handler must batch-update products too

### Files modified
- `src/pages/farmer/FarmerDashboard.tsx` — add profile/location editing section
