import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember, WorkspaceRole } from '@/types/database';
import { useAuth } from './useAuth';

export function useWorkspaces() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Single query with join to get workspaces and member counts
    const { data: wsData, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members(count)
      `)
      .order('created_at', { ascending: false });

    if (!error && wsData) {
      const workspacesWithCounts = wsData.map(ws => ({
        ...ws,
        member_count: ws.workspace_members?.[0]?.count || 0,
        workspace_members: undefined // Remove nested data
      })) as Workspace[];
      setWorkspaces(workspacesWithCounts);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchWorkspaces();
      fetchedRef.current = true;
    }
  }, [fetchWorkspaces]);

  // Reset ref when user changes
  useEffect(() => {
    fetchedRef.current = false;
  }, [user?.id]);

  const createWorkspace = async (name: string, description: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name, description, owner_id: user.id })
      .select()
      .single();

    if (wsError) return { error: wsError.message };

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'manager' as WorkspaceRole
      });

    if (memberError) return { error: memberError.message };

    // Optimistic update
    setWorkspaces(prev => [{ ...workspace, member_count: 1 } as Workspace, ...prev]);
    return { data: workspace };
  };

  const joinWorkspace = async (teamCode: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: workspaceData, error: findError } = await supabase
      .rpc('find_workspace_by_code', { code: teamCode.trim() });

    if (findError) return { error: findError.message };
    
    const workspace = workspaceData?.[0];
    if (!workspace) return { error: 'Invalid team code. Please check and try again.' };

    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return { error: 'You are already a member of this workspace' };

    const { error: joinError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'worker' as WorkspaceRole
      });

    if (joinError) return { error: joinError.message };

    await fetchWorkspaces();
    return { data: workspace };
  };

  return { workspaces, isLoading, createWorkspace, joinWorkspace, refetch: fetchWorkspaces };
}

export function useWorkspaceDetails(workspaceId: string) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [userRole, setUserRole] = useState<WorkspaceRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchDetails = useCallback(async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);

    // Parallel fetches for better performance
    const [wsResult, membersResult] = await Promise.all([
      supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .maybeSingle(),
      supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
    ]);

    if (wsResult.data) {
      setWorkspace(wsResult.data as Workspace);
    }

    if (membersResult.data) {
      const userIds = membersResult.data.map(m => m.user_id);
      
      // Only fetch profiles if there are members
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, email, avatar_url')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const formattedMembers = membersResult.data.map(m => ({
        ...m,
        profile: profiles.find(p => p.user_id === m.user_id) || null
      })) as WorkspaceMember[];
      
      setMembers(formattedMembers);
      
      const currentMember = formattedMembers.find(m => m.user_id === user.id);
      setUserRole(currentMember?.role || null);
    }

    setIsLoading(false);
  }, [user, workspaceId]);

  useEffect(() => {
    if (workspaceId && !fetchedRef.current) {
      fetchDetails();
      fetchedRef.current = true;
    }
  }, [fetchDetails, workspaceId]);

  // Reset when workspace changes
  useEffect(() => {
    fetchedRef.current = false;
    setWorkspace(null);
    setMembers([]);
    setUserRole(null);
  }, [workspaceId]);

  const updateMemberRole = async (memberId: string, newRole: WorkspaceRole) => {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (!error) {
      // Optimistic update
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
    }
    return { error: error?.message };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      // Optimistic update
      setMembers(prev => prev.filter(m => m.id !== memberId));
    }
    return { error: error?.message };
  };

  const updateWorkspace = async (name: string, description: string) => {
    const { error } = await supabase
      .from('workspaces')
      .update({ name, description })
      .eq('id', workspaceId);

    if (!error) {
      // Optimistic update
      setWorkspace(prev => prev ? { ...prev, name, description } : null);
    }
    return { error: error?.message };
  };

  return { 
    workspace, 
    members, 
    userRole, 
    isLoading, 
    isManager: userRole === 'manager',
    refetch: fetchDetails,
    updateMemberRole,
    removeMember,
    updateWorkspace
  };
}
