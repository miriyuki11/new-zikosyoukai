ALTER TABLE public.profile_cards
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE OR REPLACE VIEW public.public_profile_cards
WITH (security_invoker = false)
AS
SELECT
  slug,
  CASE WHEN public_fields ? 'self_introduction' THEN self_introduction END AS self_introduction,
  CASE WHEN public_fields ? 'skills' THEN skills END AS skills,
  CASE WHEN public_fields ? 'communication_style' THEN communication_style END AS communication_style,
  CASE WHEN public_fields ? 'consultation_style' THEN consultation_style END AS consultation_style,
  CASE WHEN public_fields ? 'free_description' THEN free_description END AS free_description,
  CASE WHEN public_fields ? 'realtime_status' THEN realtime_status END AS realtime_status,
  CASE WHEN public_fields ? 'full_name' THEN full_name END AS full_name,
  CASE WHEN public_fields ? 'avatar_url' THEN avatar_url END AS avatar_url
FROM public.profile_cards
WHERE is_public = true
  AND slug IS NOT NULL;

REVOKE ALL ON TABLE public.public_profile_cards FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_profile_cards TO anon, authenticated;