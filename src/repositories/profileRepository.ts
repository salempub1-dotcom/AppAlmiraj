import { supabase } from '../services/supabase';

export type ProfileUpdate = {
  full_name?: string;
  phone?: string | null;
  subject?: string | null;
  level?: string[];
  wilaya?: string | null;
};

export const profileRepository = {
  async getMyProfile() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { data: null, error: null };
    return supabase.from('profiles').select('*').eq('id', auth.user.id).single();
  },
  async updateMyProfile(values: ProfileUpdate) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('يجب تسجيل الدخول');
    return supabase.from('profiles').update(values).eq('id', auth.user.id).select().single();
  }
};
