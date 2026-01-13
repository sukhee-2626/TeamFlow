import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskVisibility } from '@/types/database';
import { useAuth } from './useAuth';

export function useTasks(workspaceId: string, workflowId?: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);
  const profilesCacheRef = useRef<Map<string, any>>(new Map());

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
      // Get unique assigned user IDs not in cache
      const assignedIds = [...new Set(data.filter(t => t.assigned_user_id).map(t => t.assigned_user_id!))];
      const uncachedIds = assignedIds.filter(id => !profilesCacheRef.current.has(id));
      
      // Only fetch profiles we don't have cached
      if (uncachedIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', uncachedIds);
        
        profilesData?.forEach(p => {
          profilesCacheRef.current.set(p.user_id, p);
        });
      }

      const formattedTasks = data.map(t => ({
        ...t,
        assigned_user: t.assigned_user_id ? profilesCacheRef.current.get(t.assigned_user_id) || null : null
      })) as Task[];
      
      setTasks(formattedTasks);
    }
    setIsLoading(false);
  }, [user, workspaceId, workflowId]);

  useEffect(() => {
    fetchTasks();
    fetchedRef.current = true;

    // Set up realtime subscription with debounce
    let debounceTimer: NodeJS.Timeout;
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
          // Debounce realtime updates
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchTasks();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
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

    const newTask = {
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
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (!error && data) {
      // Optimistic update
      const profile = assignedUserId ? profilesCacheRef.current.get(assignedUserId) : null;
      setTasks(prev => [...prev, { ...data, assigned_user: profile } as Task]);
    }
    return { data, error: error?.message };
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus, currentStatus: TaskStatus) => {
    const statusOrder: TaskStatus[] = ['todo', 'ongoing', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);

    if (Math.abs(newIndex - currentIndex) > 1) {
      return { error: 'Invalid status transition. Tasks must follow: To Do → Ongoing → Completed' };
    }

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      // Revert on error
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: currentStatus } : t
      ));
    }
    return { error: error?.message };
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ));

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      await fetchTasks(); // Revert on error
    }
    return { error: error?.message };
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic update
    const deletedTask = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error && deletedTask) {
      // Revert on error
      setTasks(prev => [...prev, deletedTask]);
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
