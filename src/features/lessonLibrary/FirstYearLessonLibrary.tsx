import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Lesson, LessonLibraryItem, RESOURCE_KIND_LABELS,
  listFirstYearLessons, listLessonResources,
} from './lessonLibraryRepository';

type Props = { supabase: SupabaseClient; isDark: boolean; subjectCode?: string };
const order = ['lesson_plan','worksheet','visual_aid','game','official_reference','editable','audio','video','other'] as const;

export function FirstYearLessonLibrary({ supabase, isDark, subjectCode }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [items, setItems] = useState<LessonLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = isDark
    ? { bg:'#101A2C',card:'#18263D',border:'#34435C',text:'#F6F8FC',muted:'#B3C2D8',gold:'#E3C469' }
    : { bg:'#F5F7FC',card:'#FFFFFF',border:'#DEE5EF',text:'#10244A',muted:'#52637D',gold:'#B78D2A' };

  const refresh = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listFirstYearLessons(supabase, subjectCode).then(rows => {
      if (!active) return;
      setLessons(rows);
      setSelected(old => rows.find(row => row.id === old?.id) ?? rows[0] ?? null);
    }).catch(e => { if(active) setError(e.message ?? 'تعذر تحميل الدروس'); })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [supabase, subjectCode]);

  useEffect(() => refresh(), [refresh]);
  useEffect(() => {
    if (!selected) { setItems([]); return; }
    let active = true;
    setItems([]);
    setResourceLoading(true);
    listLessonResources(supabase, selected.id)
      .then(rows => { if(active) setItems(rows); })
      .catch(e => { if(active) setError(e.message ?? 'تعذر تحميل الموارد'); })
      .finally(() => { if(active) setResourceLoading(false); });
    return () => { active = false; };
  }, [supabase, selected?.id]);

  const cardStyle = { backgroundColor:c.card,borderColor:c.border,borderWidth:1,borderRadius:16,padding:14,marginBottom:10 };
  const txt = { color:c.text,textAlign:'right' as const };
  return (
    <ScrollView style={{flex:1,backgroundColor:c.bg}} contentContainerStyle={{padding:16,paddingBottom:48}}>
      <Text style={{...txt,fontSize:24,fontWeight:'700',marginBottom:5}}>مكتبة السنة الأولى ابتدائي</Text>
      <Text style={{color:c.muted,textAlign:'right',marginBottom:18}}>اختر الدرس للوصول إلى المذكرات والأنشطة والوسائل في مكان واحد</Text>
      {loading ? <ActivityIndicator color={c.gold} /> : null}
      {error ? <Text accessibilityRole="alert" style={{color:isDark?'#FFB5B5':'#B42318',textAlign:'right',marginBottom:12}}>{error}</Text> : null}
      {!loading && lessons.length === 0 && !error ? <Text style={{color:c.muted,textAlign:'right'}}>لا توجد دروس منشورة حاليًا.</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}} contentContainerStyle={{gap:8}}>
        {lessons.map(lesson => (
          <Pressable key={lesson.id} onPress={() => {setError(null);setSelected(lesson);}}
            accessibilityRole="button" accessibilityState={{selected:lesson.id===selected?.id}}
            style={{backgroundColor:lesson.id===selected?.id?c.gold:c.card,borderRadius:12,borderColor:c.border,borderWidth:1,padding:12}}>
            <Text style={{color:lesson.id===selected?.id?'#0B1833':c.text,fontWeight:'600'}}>{lesson.title_ar}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {selected && <>
        <View style={cardStyle}>
          <Text style={{...txt,fontSize:19,fontWeight:'700'}}>{selected.title_ar}</Text>
          <Text style={{color:c.muted,textAlign:'right',marginTop:6}}>المقطع {selected.sequence_no ?? '—'} · الدرس {selected.lesson_no ?? '—'}</Text>
        </View>
        {resourceLoading ? <ActivityIndicator color={c.gold} /> : null}
        {!resourceLoading && items.length === 0 ? <Text style={{color:c.muted,textAlign:'right'}}>لا توجد موارد منشورة ومراجعة لهذا الدرس بعد.</Text> : null}
        {order.map(kind => {
          const group = items.filter(row => row.resource.resource_kind===kind);
          if (!group.length) return null;
          return <View key={kind} style={{marginTop:8,marginBottom:12}}>
            <Text style={{...txt,fontSize:17,fontWeight:'700',marginBottom:10}}>{RESOURCE_KIND_LABELS[kind]} ({group.length})</Text>
            {group.map(({resource}) => <Pressable key={resource.id} style={cardStyle}
              accessibilityRole="link" disabled={resource.access_mode==='private'||!resource.source_url}
              onPress={() => {if(resource.source_url && resource.access_mode!=='private') Linking.openURL(resource.source_url).catch(()=>setError('تعذر فتح الملف'));}}>
              <Text style={{...txt,fontWeight:'600'}}>{resource.title_ar}</Text>
              <Text style={{color:c.muted,textAlign:'right',marginTop:5}}>{resource.file_format?.toUpperCase() ?? 'مورد'} · {resource.access_mode==='private'?'ملف خاص':'عرض الملف'}</Text>
            </Pressable>)}
          </View>;
        })}
      </>}
    </ScrollView>
  );
}
