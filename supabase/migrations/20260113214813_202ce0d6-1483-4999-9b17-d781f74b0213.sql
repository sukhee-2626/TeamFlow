-- Fix workspace creation - allow users to insert workspaces where they are the owner
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Fix join workspace - allow authenticated users to read workspace by team_code for joining
-- We need a way to find workspace by team code without being a member first
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;

-- Create a function to check if user can view workspace (owner, member, or looking up by team_code)
CREATE OR REPLACE FUNCTION public.can_view_workspace(workspace_uuid UUID, workspace_team_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_uuid
    AND (
      w.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
      )
    )
  );
$$;

-- Allow users to see workspaces they own or are members of
CREATE POLICY "Members can view workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  public.is_workspace_member(id, auth.uid())
);

-- Create a separate RPC function to find workspace by team code (bypasses RLS)
CREATE OR REPLACE FUNCTION public.find_workspace_by_code(code TEXT)
RETURNS TABLE(id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id FROM public.workspaces w
  WHERE LOWER(w.team_code) = LOWER(code)
  LIMIT 1;
$$;