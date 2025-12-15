-- Add commission tracking columns to payouts
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS farmer_payout numeric DEFAULT 0;

-- Add paystack recipient code to farmer profiles for automated transfers
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS paystack_recipient_code text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_account_name text;