import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Star, MoreHorizontal, Trash2, Search, GripVertical } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useFavoriteBoards } from '@/hooks/useFavoriteBoards';
import { workspaceService, type Workspace } from '@/services/workspaceService';
import { boardService, type Board } from '@/services/boardService';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { MSym } from './MSym';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import cantimLogo from '@/assets/cantim-logo.png';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';

const STATIC_TOP = [
  { title: 'Página inicial', url: '/admin/dashboard', icon: 'home' },
  { title: 'Meu trabalho', url: '/admin/my-work', icon: 'inbox' },
];

const AI_BLOCK = [
  { title: 'Assistente de IA', url: '/admin/ia/assistant', icon: 'forum' },
  { title: 'Vibe (Insights)', url: '/admin/ia/insights', icon: 'auto_awesome' },
  { title: 'Agentes de IA', url: '/admin/ia', icon: 'smart_toy' },
  { title: 'Score IA', url: '/admin/ia/score', icon: 'leaderboard' },
];

export default function MondaySidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { workspaces, boardsByWorkspace, boards, refresh } = useWorkspaces();
  const { isFavorite, toggle: toggleFavorite, favoriteIds } = useFavoriteBoards();

  const [openWorkspaces, setOpenWorkspaces] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [createBoardForWs, setCreateBoardForWs] = useState<Workspace | null>(null);

  const initials = (user?.email ?? '?').split('@')[0].slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (e: DragEndEvent) => {
    const boardId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId || !overId.startsWith('ws:')) return;
    const targetWsId = overId.slice(3);
    const board = boards.find((b) => b.id === boardId);
    if (!board || board.workspace_id === targetWsId) return;
    const targetWs = workspaces.find((w) => w.id === targetWsId);
    try {
      await boardService.moveToWorkspace(boardId, targetWsId);
      toast.success(`Movido para "${targetWs?.name ?? 'área'}"`);
      refresh();
    } catch {
      toast.error('Não foi possível mover');
    }
  };

  const filteredWorkspaces = workspaces.filter((w) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (w.name.toLowerCase().includes(q)) return true;
    return boardsByWorkspace(w.id).some((b) => b.name.toLowerCase().includes(q));
  });

  const favoritedBoards = boards
    .filter((b) => favoriteIds.includes(b.id))
    .sort((a, b) => favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id));

  const boardHref = (b: Board) =>
    b.kind === 'route' && b.route_path ? b.route_path : `/admin/boards/${b.id}`;

  return (
    <Sidebar collapsible="icon" data-tour="sidebar" className="border-r border-hairline bg-sidebar">
      {/* Product header */}
      <SidebarHeader className="px-3 pt-3 pb-3 border-b border-hairline">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className={cn('shrink-0 rounded-lg bg-card shadow-soft flex items-center justify-center overflow-hidden p-1', collapsed ? 'h-9 w-9' : 'h-12 w-12')}>
            <img src={cantimLogo} alt="Cantim da Roça" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight flex-1">
              <p className="text-[13px] font-semibold text-sidebar-accent-foreground truncate tracking-tight">
                cantim work
              </p>
              <p className="text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium mt-0.5">
                management
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2 pb-2 gap-2">
        {/* Static top */}
        <SidebarGroup className="p-0">
          <ul className="space-y-0.5">
            {STATIC_TOP.map((it) => (
              <li key={it.url}>
                <NavLink
                  to={it.url}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[12.5px] font-medium',
                      'transition-[background-color,color] duration-crm ease-crm',
                      isActive
                        ? 'sidebar-item-active text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <MSym name={it.icon} size={17} className="shrink-0" />
                  {!collapsed && <span className="truncate">{it.title}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </SidebarGroup>

        {/* AI block */}
        <SidebarGroup className="p-0">
          {!collapsed && (
            <p className="px-2.5 mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              cantim IA
            </p>
          )}
          <ul className="space-y-0.5">
            {AI_BLOCK.map((it) => (
              <li key={it.url}>
                <NavLink
                  to={it.url}
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[12.5px] font-medium',
                      'transition-[background-color,color] duration-crm ease-crm',
                      isActive
                        ? 'sidebar-item-active text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <MSym name={it.icon} size={17} className="shrink-0" />
                  {!collapsed && <span className="truncate">{it.title}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </SidebarGroup>

        {/* Favorites */}
        {!collapsed && favoritedBoards.length > 0 && (
          <SidebarGroup className="p-0">
            <p className="px-2.5 mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Favoritos
            </p>
            <ul className="space-y-0.5">
              {favoritedBoards.map((b) => (
                <li key={b.id}>
                  <NavLink
                    to={boardHref(b)}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-2 h-7 px-2.5 rounded-md text-[12px] transition-[background-color,color] duration-crm ease-crm',
                        isActive
                          ? 'sidebar-item-active text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                      )
                    }
                  >
                    <Star size={12} className="fill-[hsl(var(--honey))] text-[hsl(var(--honey))] shrink-0" />
                    <span className="truncate flex-1">{b.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </SidebarGroup>
        )}

        {/* Workspaces */}
        <SidebarGroup className="p-0">
          {!collapsed && (
            <div className="flex items-center justify-between px-2.5 mb-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                Áreas de trabalho
              </p>
              <button
                type="button"
                onClick={() => setCreateWsOpen(true)}
                className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-[background-color,color] duration-crm ease-crm"
                aria-label="Nova área de trabalho"
              >
                <Plus size={13} />
              </button>
            </div>
          )}

          {!collapsed && (
            <div className="px-2.5 mb-2 relative">
              <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-7 pl-6 pr-2 rounded-md bg-card/40 border border-hairline text-[11.5px] text-sidebar-foreground placeholder:text-muted-foreground/70 outline-none focus:bg-card/70 focus:border-hairline-strong transition-[background-color,border-color] duration-crm ease-crm"
              />
            </div>
          )}

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <ul className="space-y-0.5">
              {filteredWorkspaces.map((ws) => {
                const isOpen = openWorkspaces[ws.id] ?? ws.is_active;
                const wsBoards = boardsByWorkspace(ws.id);
                return (
                  <DroppableWorkspaceItem key={ws.id} workspaceId={ws.id}>
                    <div className="group flex items-center gap-1 h-8 px-1.5 rounded-md hover:bg-sidebar-accent/60 transition-[background-color] duration-crm ease-crm">
                      <button
                        type="button"
                        onClick={() => setOpenWorkspaces((s) => ({ ...s, [ws.id]: !isOpen }))}
                        className="h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-sidebar-accent-foreground"
                        aria-label={isOpen ? 'Recolher' : 'Expandir'}
                      >
                        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: ws.color }}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-[12.5px] font-medium text-sidebar-foreground">
                            {ws.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCreateBoardForWs(ws)}
                            className="opacity-0 group-hover:opacity-100 h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/70 transition-all"
                            aria-label="Novo board"
                          >
                            <Plus size={12} />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="opacity-0 group-hover:opacity-100 h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/70 transition-all"
                                aria-label="Menu"
                              >
                                <MoreHorizontal size={13} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 border-hairline shadow-floating">
                              <DropdownMenuItem
                                onClick={async () => {
                                  const name = window.prompt('Renomear área de trabalho', ws.name);
                                  if (!name?.trim()) return;
                                  await workspaceService.update(ws.id, { name: name.trim() });
                                  refresh();
                                }}
                              >
                                Renomear
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  await workspaceService.setActive(ws.id);
                                  refresh();
                                }}
                              >
                                Definir como ativa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  if (!window.confirm(`Excluir "${ws.name}" e todos os boards?`)) return;
                                  try {
                                    await workspaceService.remove(ws.id);
                                    toast.success('Área de trabalho excluída');
                                    refresh();
                                  } catch (e) {
                                    toast.error('Não foi possível excluir');
                                  }
                                }}
                              >
                                <Trash2 size={13} className="mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>

                    {isOpen && !collapsed && (
                      <ul className="ml-5 pl-3 border-l border-hairline space-y-0.5 mt-0.5 mb-1">
                        {wsBoards.length === 0 && (
                          <li className="text-[11px] text-muted-foreground/70 px-2 py-1 italic">
                            Sem boards ainda
                          </li>
                        )}
                        {wsBoards.map((b) => (
                          <DraggableBoardRow key={b.id} board={b}>
                            <NavLink
                              to={boardHref(b)}
                              end={b.kind === 'route'}
                              className={({ isActive }) =>
                                cn(
                                  'flex-1 flex items-center gap-2 h-7 px-2 rounded-md text-[12px] transition-[background-color,color] duration-crm ease-crm',
                                  isActive
                                    ? 'sidebar-item-active text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                                )
                              }
                            >
                              <MSym name={b.icon || 'square'} size={14} className="opacity-70 shrink-0" />
                              <span className="truncate">{b.name}</span>
                            </NavLink>
                            <button
                              type="button"
                              onClick={() => toggleFavorite(b.id)}
                              className={cn(
                                'h-6 w-6 inline-flex items-center justify-center rounded transition-all',
                                isFavorite(b.id)
                                  ? 'opacity-100 text-[hsl(var(--honey))]'
                                  : 'opacity-0 group-hover/board:opacity-100 text-muted-foreground hover:text-[hsl(var(--honey))]',
                              )}
                              aria-label="Favoritar"
                            >
                              <Star
                                size={12}
                                className={isFavorite(b.id) ? 'fill-current' : ''}
                              />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="opacity-0 group-hover/board:opacity-100 h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/70 transition-all"
                                  aria-label="Menu"
                                >
                                  <MoreHorizontal size={12} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 border-hairline shadow-floating">
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const name = window.prompt('Renomear board', b.name);
                                    if (!name?.trim()) return;
                                    await boardService.update(b.id, { name: name.trim() });
                                    refresh();
                                  }}
                                >
                                  Renomear
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={async () => {
                                    if (!window.confirm(`Excluir "${b.name}"?`)) return;
                                    await boardService.remove(b.id);
                                    toast.success('Board excluído');
                                    refresh();
                                  }}
                                >
                                  <Trash2 size={12} className="mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </DraggableBoardRow>
                        ))}
                      </ul>
                    )}
                  </DroppableWorkspaceItem>
                );
              })}
            </ul>
          </DndContext>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <TooltipProvider delayDuration={300}>
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-md',
              !collapsed && 'p-1.5 hover:bg-sidebar-accent/60 transition-colors',
            )}
          >
            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[11.5px] font-semibold text-sidebar-accent-foreground truncate">
                    {user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[9.5px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSignOut}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Sair"
                    >
                      <MSym name="logout" size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Sair</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      </SidebarFooter>

      <CreateWorkspaceDialog
        open={createWsOpen}
        onOpenChange={setCreateWsOpen}
        onCreated={refresh}
      />
      <CreateBoardDialog
        workspace={createBoardForWs}
        onOpenChange={(o) => !o && setCreateBoardForWs(null)}
        onCreated={refresh}
      />
    </Sidebar>
  );
}

function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#5a7048');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workspaceService.create({ name: name.trim(), color });
      toast.success('Área criada');
      setName('');
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error('Erro ao criar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova área de trabalho</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Nome</Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Marketing"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-color">Cor</Label>
            <input
              id="ws-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 rounded border border-input bg-background"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateBoardDialog({
  workspace,
  onOpenChange,
  onCreated,
}: {
  workspace: Workspace | null;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!workspace || !name.trim()) return;
    setSaving(true);
    try {
      await boardService.create({
        workspace_id: workspace.id,
        name: name.trim(),
        kind: 'task_board',
        color: workspace.color,
      });
      toast.success('Board criado');
      setName('');
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error('Erro ao criar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!workspace} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo board em {workspace?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="b-name">Nome</Label>
            <Input
              id="b-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Sprint da semana"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Será criado um board de tarefas (kanban por status).
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DroppableWorkspaceItem({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `ws:${workspaceId}` });
  return (
    <li
      ref={setNodeRef}
      className={cn(
        'rounded-md transition-[background-color,box-shadow,outline] duration-crm ease-crm',
        isOver && 'outline outline-2 outline-primary/60 outline-offset-[-2px] bg-primary/8 shadow-soft',
      )}
    >
      {children}
    </li>
  );
}

function DraggableBoardRow({
  board,
  children,
}: {
  board: Board;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: board.id });
  return (
    <li
      ref={setNodeRef}
      className={cn(
        'group/board rounded-md',
        isDragging && 'opacity-40',
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="h-6 w-4 inline-flex items-center justify-center text-muted-foreground/60 hover:text-sidebar-accent-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover/board:opacity-100 transition-opacity"
          aria-label="Arrastar"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={11} />
        </button>
        {children}
      </div>
    </li>
  );
}

