-- Create role enum
CREATE TYPE public.workspace_role AS ENUM ('manager', 'worker');

-- Create task visibility enum
CREATE TYPE public.task_visibility AS ENUM ('public', 'private');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('todo', 'ongoing', 'completed');

-- Create workspaces table with team code
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  team_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  visibility task_visibility NOT NULL DEFAULT 'public',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Function to check if user is member of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspace_uuid AND user_id = user_uuid
  );
$$;

-- Function to check if user is manager of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_manager(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspace_uuid AND user_id = user_uuid AND role = 'manager'
  );
$$;

-- Function to get user role in workspace
CREATE OR REPLACE FUNCTION public.get_workspace_role(workspace_uuid UUID, user_uuid UUID)
RETURNS workspace_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = workspace_uuid AND user_id = user_uuid
  LIMIT 1;
$$;

-- Workspaces policies
CREATE POLICY "Members can view their workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (public.is_workspace_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create workspaces"
ON public.workspaces FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Managers can update workspaces"
ON public.workspaces FOR UPDATE
TO authenticated
USING (public.is_workspace_manager(id, auth.uid()));

CREATE POLICY "Managers can delete workspaces"
ON public.workspaces FOR DELETE
TO authenticated
USING (public.is_workspace_manager(id, auth.uid()));

-- Workspace members policies
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can join via team code"
ON public.workspace_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update members"
ON public.workspace_members FOR UPDATE
TO authenticated
USING (public.is_workspace_manager(workspace_id, auth.uid()));

CREATE POLICY "Managers can remove members"
ON public.workspace_members FOR DELETE
TO authenticated
USING (public.is_workspace_manager(workspace_id, auth.uid()));

-- Tasks policies
-- View: Members see public tasks, managers see all, workers see assigned private tasks
CREATE POLICY "Task visibility policy"
ON public.tasks FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id, auth.uid()) AND (
    visibility = 'public' OR
    public.is_workspace_manager(workspace_id, auth.uid()) OR
    assigned_user_id = auth.uid()
  )
);

-- Insert: Only managers can create tasks
CREATE POLICY "Only managers can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_manager(workspace_id, auth.uid()) AND
  auth.uid() = created_by
);

-- Update: Managers can update all, workers can only update status of assigned tasks
CREATE POLICY "Task update policy"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id, auth.uid()) AND (
    public.is_workspace_manager(workspace_id, auth.uid()) OR
    assigned_user_id = auth.uid()
  )
);

-- Delete: Only managers can delete tasks
CREATE POLICY "Only managers can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (public.is_workspace_manager(workspace_id, auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;