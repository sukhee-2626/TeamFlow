export type WorkspaceRole = 'manager' | 'worker';
export type TaskVisibility = 'public' | 'private';
export type TaskStatus = 'todo' | 'ongoing' | 'completed';

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  team_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  profile?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  visibility: TaskVisibility;
  deadline: string;
  assigned_user_id: string | null;
  created_by: string;
  position: number;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    name: string | null;
    email: string | null;
  };
}
