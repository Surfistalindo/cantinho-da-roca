-- 1. workspaces
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder',
  color TEXT NOT NULL DEFAULT '#5a7048',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id, position);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or admin can view workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner can insert workspaces"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner or admin can update workspaces"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner or admin can delete workspaces"
  ON public.workspaces FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. boards
CREATE TABLE public.boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'square',
  color TEXT NOT NULL DEFAULT '#0073ea',
  position INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'route' CHECK (kind IN ('route', 'task_board')),
  route_path TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_boards_workspace ON public.boards(workspace_id, position);
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view boards in own workspaces or admin"
  ON public.boards FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "insert boards in own workspaces"
  ON public.boards FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "update boards in own workspaces or admin"
  ON public.boards FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "delete boards in own workspaces or admin"
  ON public.boards FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE TRIGGER trg_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. board_favorites
CREATE TABLE public.board_favorites (
  user_id UUID NOT NULL,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, board_id)
);
CREATE INDEX idx_board_favorites_user ON public.board_favorites(user_id, position);
ALTER TABLE public.board_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manages own favorites - select"
  ON public.board_favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "user manages own favorites - insert"
  ON public.board_favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user manages own favorites - update"
  ON public.board_favorites FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "user manages own favorites - delete"
  ON public.board_favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. task_board_items
CREATE TABLE public.task_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done','blocked')),
  assignee_id UUID,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_items_board ON public.task_board_items(board_id, status, position);
ALTER TABLE public.task_board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view items in accessible boards"
  ON public.task_board_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE b.id = board_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );
CREATE POLICY "insert items in accessible boards"
  ON public.task_board_items FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE b.id = board_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );
CREATE POLICY "update items in accessible boards"
  ON public.task_board_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE b.id = board_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );
CREATE POLICY "delete items in accessible boards"
  ON public.task_board_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.workspaces w ON w.id = b.workspace_id
      WHERE b.id = board_id AND (w.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE TRIGGER trg_task_items_updated_at
  BEFORE UPDATE ON public.task_board_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();