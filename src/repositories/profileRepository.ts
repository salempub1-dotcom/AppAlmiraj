import { supabase } from '../services/supabase';

export type ProfileUpdate = {
  full_name?: string;
  phone?: string | null;
  subject?: string | null;
  level?: string[];
  wilaya?: string | null;
  avatar_url?: string | null;
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
  },
  async uploadAvatar(uri: string) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('يجب تسجيل الدخول');

    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 3 * 1024 * 1024) {
      throw new Error('الصورة كبيرة جدًا. اختر صورة أصغر من 3MB.');
    }

    const path = `${auth.user.id}/avatar/profile-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('community-media')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('community-media').getPublicUrl(path);
    const avatarUrl = data.publicUrl;
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', auth.user.id);
    if (profileError) throw profileError;

    return avatarUrl;
  }
};
