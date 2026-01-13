import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workflow } from '@/types/database';
import { useAuth } from './useAuth';

export function useWorkflows(workspaceId: string) {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkflows = useCallback(async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setWorkflows(data as Workflow[]);
    }
    setIsLoading(false);
  }, [user, workspaceId]);

  useEffect(() => {
    fetchWorkflows();

    // Set up realtime subscription
    const channel = supabase
      .channel(`workflows-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflows',
          filter: `workspace_id=eq.${workspaceId}`
        },
        () => {
          fetchWorkflows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWorkflows, workspaceId]);

  const createWorkflow = async (name: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        workspace_id: workspaceId,
        name
      })
      .select()
      .single();

    if (!error) {
      await fetchWorkflows();
    }
    return { data, error: error?.message };
  };

  const updateWorkflow = async (workflowId: string, name: string) => {
    const { error } = await supabase
      .from('workflows')
      .update({ name })
      .eq('id', workflowId);

    if (!error) {
      await fetchWorkflows();
    }
    return { error: error?.message };
  };

  const deleteWorkflow = async (workflowId: string) => {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (!error) {
      await fetchWorkflows();
    }
    return { error: error?.message };
  };

  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    refetch: fetchWorkflows
  };
}
