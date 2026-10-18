import type { SupabaseClient } from '@supabase/supabase-js';

export type ResourceKind =
  | 'lesson_plan' | 'worksheet' | 'visual_aid' | 'game'
  | 'official_reference' | 'editable' | 'audio' | 'video' | 'other';

export interface Lesson {
  id: string;
  title_ar: string;
  subject_code: string;
  sequence_no: number | null;
  lesson_no: number | null;
  slug: string;
}

export interface LessonResource {
  id: string;
  title_ar: string;
  resource_kind: ResourceKind;
  file_format: string | null;
  source_url: string | null;
  access_mode: 'external' | 'public' | 'private';
}

export interface LessonLibraryItem {
  resource: LessonResource;
  display_order: number;
}

/** All reads are protected by server-side RLS. No service_role key belongs in the app. */
export async function listFirstYearLessons(
  supabase: SupabaseClient,
  subjectCode?: string,
): Promise<Lesson[]> {
  let query = supabase.from('miraj_lessons')
    .select('id,title_ar,subject_code,sequence_no,lesson_no,slug')
    .eq('level_code', '1AP')
    .order('sequence_no', { ascending: true })
    .order('lesson_no', { ascending: true });
  if (subjectCode) query = query.eq('subject_code', subjectCode);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Lesson[];
}

/** Published & verified resources only; RLS also protects linked lesson rows. */
export async function listLessonResources(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<LessonLibraryItem[]> {
  const { data, error } = await supabase
    .from('miraj_lesson_resources')
    .select('display_order, miraj_learning_resources(id,title_ar,resource_kind,file_format,source_url,access_mode)')
    .eq('lesson_id', lessonId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).flatMap((entry: any) => {
    const value = entry.miraj_learning_resources;
    if (!value || Array.isArray(value)) return [];
    return [{ resource: value as LessonResource, display_order: entry.display_order }];
  });
}

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  lesson_plan: 'المذكرات', worksheet: 'أوراق العمل',
  visual_aid: 'الوسائل التعليمية', game: 'الألعاب',
  official_reference: 'المراجع الرسمية', editable: 'نسخ قابلة للتعديل',
  audio: 'الملفات الصوتية', video: 'الفيديوهات', other: 'موارد أخرى',
};
