-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_state text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS produce_interests text[];

-- Update RLS to allow users to update their own profile preferences
-- (already covered by existing "Users can update their own profile" policy)