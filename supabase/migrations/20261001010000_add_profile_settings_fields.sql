ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tech_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hobby_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profile_cards
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS tech_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hobby_tags text[] NOT NULL DEFAULT '{}';