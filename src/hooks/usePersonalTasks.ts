import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type PersonalTaskStatus = 'todo' | 'ongoing' | 'completed';
export type PersonalTaskPriority = 'low' | 'medium' | 'high';

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: PersonalTaskStatus;
  priority: PersonalTaskPriority;
  scheduled_at: string | null;
  deadline: string | null;
  completed_at: string | null;
  position: number;
  stage_id: string | null;
  created_at: string;
  updated_at: string;
}

export function usePersonalTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('personal_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (!error && data) setTasks(data as PersonalTask[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
    if (!user) return;
    const channel = supabase
      .channel(`personal-tasks-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'personal_tasks',
        filter: `user_id=eq.${user.id}`
      }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks, user]);

  const createTask = async (input: {
    title: string;
    description?: string;
    priority?: PersonalTaskPriority;
    scheduled_at?: string | null;
    deadline?: string | null;
  }) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await (supabase as any)
      .from('personal_tasks')
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? 'medium',
        scheduled_at: input.scheduled_at ?? null,
        deadline: input.deadline ?? null,
        position: tasks.length,
      })
      .select()
      .single();
    if (!error && data) setTasks(prev => [data as PersonalTask, ...prev]);
    return { data, error: error?.message };
  };

  const updateTask = async (id: string, updates: Partial<PersonalTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await (supabase as any)
      .from('personal_tasks')
      .update(updates)
      .eq('id', id);
    if (error) await fetchTasks();
    return { error: error?.message };
  };

  const toggleComplete = async (task: PersonalTask) => {
    const isDone = task.status === 'completed';
    return updateTask(task.id, {
      status: isDone ? 'todo' : 'completed',
      completed_at: isDone ? null : new Date().toISOString(),
    });
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await (supabase as any)
      .from('personal_tasks')
      .delete()
      .eq('id', id);
    if (error) await fetchTasks();
    return { error: error?.message };
  };

  return { tasks, isLoading, createTask, updateTask, toggleComplete, deleteTask, refetch: fetchTasks };
}

export function useAssignedWorkspaceTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data: rows } = await supabase
      .from('tasks')
      .select('*, workspace:workspaces(id, name)')
      .eq('assigned_user_id', user.id)
      .order('deadline', { ascending: true });
    setTasks(rows || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, isLoading, refetch: fetchTasks };
}