import { supabase } from '@/lib/supabase';

export const createClient = () => {
  return supabase;
};

export { supabase };
export default createClient;
