import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember, WorkspaceRole } from '@/types/database';
import { useAuth } from './useAuth';

export function useWorkspaces() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWorkspaces(data as Workspace[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const createWorkspace = async (name: string, description: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name, description, owner_id: user.id })
      .select()
      .single();

    if (wsError) return { error: wsError.message };

    // Add creator as manager
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'manager' as WorkspaceRole
      });

    if (memberError) return { error: memberError.message };

    await fetchWorkspaces();
    return { data: workspace };
  };

  const joinWorkspace = async (teamCode: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Find workspace by team code
    const { data: workspace, error: findError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('team_code', teamCode.toLowerCase().trim())
      .maybeSingle();

    if (findError) return { error: findError.message };
    if (!workspace) return { error: 'Invalid team code' };

    // Check if already a member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return { error: 'You are already a member of this workspace' };

    // Join as worker
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

  const fetchDetails = async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);

    // Fetch workspace
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .maybeSingle();

    if (wsData) {
      setWorkspace(wsData as Workspace);
    }

    // Fetch members with profiles
    const { data: membersData } = await supabase
      .from('workspace_members')
      .select(`
        *,
        profile:profiles!workspace_members_user_id_fkey(name, email, avatar_url)
      `)
      .eq('workspace_id', workspaceId);

    if (membersData) {
      const formattedMembers = membersData.map(m => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
      })) as WorkspaceMember[];
      setMembers(formattedMembers);
      
      const currentMember = formattedMembers.find(m => m.user_id === user.id);
      setUserRole(currentMember?.role || null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDetails();
  }, [user, workspaceId]);

  const updateMemberRole = async (memberId: string, newRole: WorkspaceRole) => {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (!error) {
      await fetchDetails();
    }
    return { error: error?.message };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      await fetchDetails();
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
    removeMember
  };
}
