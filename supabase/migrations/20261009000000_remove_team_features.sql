BEGIN;

ALTER TABLE IF EXISTS public.profile_cards
  DROP COLUMN IF EXISTS team_id;

ALTER TABLE IF EXISTS public.profiles
  DROP COLUMN IF EXISTS team_id;

DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.teams;

DROP FUNCTION IF EXISTS public.can_manage_team_members(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_team_creator(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_team_admin_or_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_team_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_manage_team_members(uuid);
DROP FUNCTION IF EXISTS public.is_team_creator(uuid);
DROP FUNCTION IF EXISTS public.is_team_admin_or_owner(uuid);
DROP FUNCTION IF EXISTS public.is_team_member(uuid);
DROP FUNCTION IF EXISTS public.prevent_team_created_by_change();

COMMIT;
