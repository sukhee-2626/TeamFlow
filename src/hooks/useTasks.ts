import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskVisibility } from '@/types/database';
import { useAuth } from './useAuth';

export function useTasks(workspaceId: string, workflowId?: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch assigned user profiles
      const assignedIds = data.filter(t => t.assigned_user_id).map(t => t.assigned_user_id);
      let profiles: any[] = [];
      
      if (assignedIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', assignedIds);
        profiles = profilesData || [];
      }

      const formattedTasks = data.map(t => ({
        ...t,
        assigned_user: profiles.find(p => p.user_id === t.assigned_user_id) || null
      })) as Task[];
      
      setTasks(formattedTasks);
    }
    setIsLoading(false);
  }, [user, workspaceId, workflowId]);

  useEffect(() => {
    fetchTasks();

    // Set up realtime subscription
    const channel = supabase
      .channel(`tasks-${workspaceId}-${workflowId || 'all'}`)
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
  }, [fetchTasks, workspaceId, workflowId]);

  const createTask = async (
    title: string,
    description: string,
    deadline: Date,
    visibility: TaskVisibility,
    assignedUserId: string | null,
    workflowIdParam?: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: workspaceId,
        workflow_id: workflowIdParam || workflowId || null,
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

    // Allow moving forward or backward by one step
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
