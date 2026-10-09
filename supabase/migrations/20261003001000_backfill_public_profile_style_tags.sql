BEGIN;

UPDATE public.profile_cards
SET public_fields =
  public_fields
  || CASE
    WHEN coalesce(array_length(work_style_tags, 1), 0) > 0
      AND NOT (public_fields ? 'work_style_tags')
    THEN '["work_style_tags"]'::jsonb
    ELSE '[]'::jsonb
  END
  || CASE
    WHEN coalesce(array_length(hobby_tags, 1), 0) > 0
      AND NOT (public_fields ? 'hobby_tags')
    THEN '["hobby_tags"]'::jsonb
    ELSE '[]'::jsonb
  END
WHERE is_public = true
  AND (
    (coalesce(array_length(work_style_tags, 1), 0) > 0 AND NOT (public_fields ? 'work_style_tags'))
    OR (coalesce(array_length(hobby_tags, 1), 0) > 0 AND NOT (public_fields ? 'hobby_tags'))
  );

COMMIT;