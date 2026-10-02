import { createServerSupabaseClient } from '@/lib/supabase/server';

export const createClient = () => {
  return createServerSupabaseClient();
};

export default createClient;
