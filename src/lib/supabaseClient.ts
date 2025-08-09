import { supabase as baseSupabase } from '@/integrations/supabase/client';

export const supabase = baseSupabase;

export type UserProfileRecord = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: 'student' | 'teacher';
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
};

export const getUserProfile = async (userId: string): Promise<UserProfileRecord | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  const role = (data as any).role as 'student' | 'teacher';
  return { ...(data as any), role } as UserProfileRecord;
};

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfileRecord>
) => {
  return await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId);
};

export const createUserProfile = async (
  userId: string,
  profileData: { email: string; role: 'student' | 'teacher'; first_name?: string | null; last_name?: string | null; avatar_url?: string | null; bio?: string | null; }
) => {
  return await supabase
    .from('profiles')
    .insert([{ id: userId, ...profileData }]);
};
