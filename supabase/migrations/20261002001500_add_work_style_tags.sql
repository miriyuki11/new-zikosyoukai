ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS work_style_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profile_cards
  ADD COLUMN IF NOT EXISTS work_style_tags text[] NOT NULL DEFAULT '{}';