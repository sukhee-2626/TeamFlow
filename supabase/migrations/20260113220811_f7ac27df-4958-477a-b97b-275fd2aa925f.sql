-- Add recipient_id column for direct messages (null = group chat, non-null = DM)
ALTER TABLE public.messages 
ADD COLUMN recipient_id UUID DEFAULT NULL;

-- Update RLS policy for viewing messages - can see group messages OR DMs where you're sender/recipient
DROP POLICY IF EXISTS "Members can view workspace messages" ON public.messages;

CREATE POLICY "Members can view workspace messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  is_workspace_member(workspace_id, auth.uid()) AND (
    recipient_id IS NULL OR -- Group messages
    sender_id = auth.uid() OR -- Messages you sent
    recipient_id = auth.uid() -- Messages sent to you
  )
);