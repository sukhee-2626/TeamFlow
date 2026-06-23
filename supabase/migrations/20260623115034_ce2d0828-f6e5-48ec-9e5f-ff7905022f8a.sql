
CREATE TABLE public.personal_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'slate',
  position integer NOT NULL DEFAULT 0,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_stages TO authenticated;
GRANT ALL ON public.personal_stages TO service_role;

ALTER TABLE public.personal_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own stages"
  ON public.personal_stages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_personal_stages_updated_at
  BEFORE UPDATE ON public.personal_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_personal_stages_user ON public.personal_stages(user_id, position);

ALTER TABLE public.personal_tasks
  ADD COLUMN stage_id uuid REFERENCES public.personal_stages(id) ON DELETE SET NULL;

CREATE INDEX idx_personal_tasks_stage ON public.personal_tasks(stage_id);
