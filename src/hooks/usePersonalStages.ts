import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PersonalStage {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export const STAGE_COLORS = [
  { id: 'slate', tint: 'bg-muted/50', dot: 'bg-slate-400' },
  { id: 'amber', tint: 'bg-amber-500/5', dot: 'bg-amber-500' },
  { id: 'blue', tint: 'bg-blue-500/5', dot: 'bg-blue-500' },
  { id: 'violet', tint: 'bg-violet-500/5', dot: 'bg-violet-500' },
  { id: 'rose', tint: 'bg-rose-500/5', dot: 'bg-rose-500' },
  { id: 'green', tint: 'bg-green-500/5', dot: 'bg-green-500' },
];

export const colorFor = (id: string) =>
  STAGE_COLORS.find(c => c.id === id) ?? STAGE_COLORS[0];

const DEFAULT_STAGES = [
  { name: 'To Do', color: 'slate', is_done: false },
  { name: 'In Progress', color: 'amber', is_done: false },
  { name: 'Done', color: 'green', is_done: true },
];

export function usePersonalStages() {
  const { user } = useAuth();
  const [stages, setStages] = useState<PersonalStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const seeded = useRef(false);

  const fetchStages = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from('personal_stages')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });
    if (error) { setIsLoading(false); return; }
    if ((!data || data.length === 0) && !seeded.current) {
      seeded.current = true;
      const rows = DEFAULT_STAGES.map((s, i) => ({ ...s, user_id: user.id, position: i }));
      const { data: inserted } = await (supabase as any)
        .from('personal_stages').insert(rows).select();
      setStages((inserted as PersonalStage[]) || []);
    } else {
      setStages((data as PersonalStage[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStages();
    if (!user) return;
    const channel = supabase
      .channel(`personal-stages-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'personal_stages',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchStages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStages, user]);

  const createStage = async (input: { name: string; color?: string; is_done?: boolean }) => {
    if (!user) return { error: 'Not authenticated' };
    const position = stages.length;
    const { data, error } = await (supabase as any)
      .from('personal_stages')
      .insert({
        user_id: user.id,
        name: input.name,
        color: input.color ?? 'slate',
        is_done: input.is_done ?? false,
        position,
      })
      .select().single();
    if (!error && data) setStages(prev => [...prev, data as PersonalStage]);
    return { data, error: error?.message };
  };

  const updateStage = async (id: string, updates: Partial<PersonalStage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    const { error } = await (supabase as any)
      .from('personal_stages').update(updates).eq('id', id);
    if (error) await fetchStages();
    return { error: error?.message };
  };

  const deleteStage = async (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
    const { error } = await (supabase as any)
      .from('personal_stages').delete().eq('id', id);
    if (error) await fetchStages();
    return { error: error?.message };
  };

  const reorderStages = async (orderedIds: string[]) => {
    const next = orderedIds
      .map((id, position) => {
        const s = stages.find(x => x.id === id);
        return s ? { ...s, position } : null;
      })
      .filter(Boolean) as PersonalStage[];
    setStages(next);
    await Promise.all(
      next.map(s =>
        (supabase as any).from('personal_stages')
          .update({ position: s.position }).eq('id', s.id)
      )
    );
  };

  return { stages, isLoading, createStage, updateStage, deleteStage, reorderStages, refetch: fetchStages };
}