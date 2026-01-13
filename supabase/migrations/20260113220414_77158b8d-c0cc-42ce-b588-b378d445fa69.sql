-- Create messages table for workspace chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages in their workspace
CREATE POLICY "Members can view workspace messages"
ON public.messages FOR SELECT
TO authenticated
USING (is_workspace_member(workspace_id, auth.uid()));

-- Members can send messages
CREATE POLICY "Members can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  is_workspace_member(workspace_id, auth.uid()) AND 
  sender_id = auth.uid()
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();