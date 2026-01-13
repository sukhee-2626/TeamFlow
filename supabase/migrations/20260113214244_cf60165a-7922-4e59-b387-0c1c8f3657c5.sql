-- Fix RLS policy for workspaces to allow owner to see their workspaces
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;

-- Allow users to see workspaces they own OR are members of
CREATE POLICY "Users can view their workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR 
  public.is_workspace_member(id, auth.uid())
);

-- Create workflows table for custom workflows
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Workflow policies
CREATE POLICY "Members can view workflows"
ON public.workflows FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Managers can create workflows"
ON public.workflows FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_manager(workspace_id, auth.uid()));

CREATE POLICY "Managers can update workflows"
ON public.workflows FOR UPDATE
TO authenticated
USING (public.is_workspace_manager(workspace_id, auth.uid()));

CREATE POLICY "Managers can delete workflows"
ON public.workflows FOR DELETE
TO authenticated
USING (public.is_workspace_manager(workspace_id, auth.uid()));

-- Add workflow_id to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE;

-- Trigger for workflows updated_at
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for workflows
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflows;