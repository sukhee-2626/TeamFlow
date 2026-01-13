import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskVisibility } from '@/types/database';
import { useAuth } from './useAuth';

export function useTasks(workspaceId: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_user_id_fkey(name, email)
      `)
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (!error && data) {
      const formattedTasks = data.map(t => ({
        ...t,
        assigned_user: Array.isArray(t.assigned_user) ? t.assigned_user[0] : t.assigned_user
      })) as Task[];
      setTasks(formattedTasks);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    // Set up realtime subscription
    const channel = supabase
      .channel(`tasks-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `workspace_id=eq.${workspaceId}`
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, workspaceId]);

  const createTask = async (
    title: string,
    description: string,
    deadline: Date,
    visibility: TaskVisibility,
    assignedUserId: string | null
  ) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: workspaceId,
        title,
        description,
        deadline: deadline.toISOString(),
        visibility,
        assigned_user_id: assignedUserId,
        created_by: user.id,
        status: 'todo' as TaskStatus,
        position: tasks.length
      })
      .select()
      .single();

    if (!error) {
      await fetchTasks();
    }
    return { data, error: error?.message };
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus, currentStatus: TaskStatus) => {
    // Enforce status flow: todo -> ongoing -> completed
    const statusOrder: TaskStatus[] = ['todo', 'ongoing', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);

    // Allow moving forward one step or backward one step
    if (Math.abs(newIndex - currentIndex) > 1) {
      return { error: 'Invalid status transition. Tasks must follow: To Do → Ongoing → Completed' };
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      await fetchTasks();
    }
    return { error: error?.message };
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (!error) {
      await fetchTasks();
    }
    return { error: error?.message };
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      await fetchTasks();
    }
    return { error: error?.message };
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
}
