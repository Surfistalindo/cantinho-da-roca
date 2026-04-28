import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import EmptyState from '@/components/admin/EmptyState';
import LoadingState from '@/components/admin/LoadingState';
import PageHeader from '@/components/admin/PageHeader';
import { StatusBadge, UserAvatar, PageTabs, ActionToolbar, DataBoard } from '@/components/crm/ui';
import { faTriangleExclamation, faCheck, faUsers, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type CheckStatus = 'pending' | 'pass' | 'fail';

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
}

const initialChecks: CheckItem[] = [
  { id: 'dialog', label: 'Dialog (modal) abre e fecha', status: 'pending' },
  { id: 'sheet', label: 'Sheet lateral abre e fecha', status: 'pending' },
  { id: 'alert', label: 'AlertDialog confirma ação', status: 'pending' },
  { id: 'toast', label: 'Toast (shadcn) dispara', status: 'pending' },
  { id: 'sonner', label: 'Sonner toast dispara', status: 'pending' },
  { id: 'loading-skeleton', label: 'LoadingState skeleton renderiza', status: 'pending' },
  { id: 'loading-spinner', label: 'LoadingState spinner renderiza', status: 'pending' },
  { id: 'loading-cards', label: 'LoadingState cards renderiza', status: 'pending' },
  { id: 'empty', label: 'EmptyState renderiza', status: 'pending' },
  { id: 'badges', label: 'StatusBadge variantes renderizam', status: 'pending' },
  { id: 'avatar', label: 'UserAvatar renderiza', status: 'pending' },
  { id: 'tabs', label: 'PageTabs alterna abas', status: 'pending' },
];

const statusVariants = ['success', 'warning', 'danger', 'info', 'neutral', 'purple', 'pink', 'orange', 'cyan', 'indigo', 'teal'] as const;

export default function AuditUiPage() {
  const { toast } = useToast();
  const [checks, setChecks] = useState<CheckItem[]>(initialChecks);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingVariant, setLoadingVariant] = useState<'skeleton' | 'spinner' | 'cards'>('skeleton');
  const [showLoading, setShowLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const setStatus = (id: string, status: CheckStatus) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const pendingCount = checks.filter((c) => c.status === 'pending').length;

  const tabs = [
    { value: 'overview', label: 'Visão geral' },
    { value: 'overlays', label: 'Modais & Sheets' },
    { value: 'states', label: 'Estados' },
    { value: 'tokens', label: 'Tokens visuais' },
  ];

  return (
    <div className="font-crm space-y-4 max-w-[1600px] mx-auto">
      <PageHeader
        title="Audit UI"
        description="Página interna de validação visual e comportamental dos componentes — não altera dados."
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="board-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold mt-1">{checks.length}</p>
        </div>
        <div className="board-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aprovados</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-500">{passCount}</p>
        </div>
        <div className="board-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Falhas</p>
          <p className="text-2xl font-semibold mt-1 text-rose-500">{failCount}</p>
        </div>
        <div className="board-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-semibold mt-1 text-muted-foreground">{pendingCount}</p>
        </div>
      </div>

      <PageTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <DataBoard title="Checklist de validação">
          <ul className="divide-y divide-border/60">
            {checks.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={
                      'inline-flex h-2 w-2 rounded-full ' +
                      (c.status === 'pass'
                        ? 'bg-emerald-500'
                        : c.status === 'fail'
                        ? 'bg-rose-500'
                        : 'bg-muted-foreground/50')
                    }
                  />
                  <span className="text-[13px]">{c.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={c.status === 'pass' ? 'default' : 'outline'}
                    className="h-7 text-[11px]"
                    onClick={() => setStatus(c.id, 'pass')}
                  >
                    <FontAwesomeIcon icon={faCheck} className="w-3 h-3 mr-1" />
                    OK
                  </Button>
                  <Button
                    size="sm"
                    variant={c.status === 'fail' ? 'destructive' : 'outline'}
                    className="h-7 text-[11px]"
                    onClick={() => setStatus(c.id, 'fail')}
                  >
                    <FontAwesomeIcon icon={faTriangleExclamation} className="w-3 h-3 mr-1" />
                    Falhou
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </DataBoard>
      )}

      {activeTab === 'overlays' && (
        <div className="grid gap-4 md:grid-cols-2">
          <DataBoard title="Dialog (modal)">
            <div className="p-4 space-y-3">
              <p className="text-[12px] text-muted-foreground">
                Confirma se o modal padrão abre, recebe foco e fecha sem travar a UI.
              </p>
              <Dialog onOpenChange={(open) => !open && setStatus('dialog', 'pass')}>
                <DialogTrigger asChild>
                  <Button size="sm">Abrir Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog de teste</DialogTitle>
                    <DialogDescription>
                      Conteúdo de exemplo. Feche para marcar como aprovado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="audit-name">Nome</Label>
                    <Input id="audit-name" placeholder="Digite algo…" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm">Cancelar</Button>
                    <Button size="sm">Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </DataBoard>

          <DataBoard title="Sheet lateral">
            <div className="p-4 space-y-3">
              <p className="text-[12px] text-muted-foreground">
                Verifica se o sheet abre na lateral e fecha por overlay/ESC.
              </p>
              <Sheet onOpenChange={(open) => !open && setStatus('sheet', 'pass')}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline">Abrir Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Sheet de teste</SheetTitle>
                    <SheetDescription>Painel lateral com formulário de exemplo.</SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-3">
                    <Label htmlFor="audit-email">E-mail</Label>
                    <Input id="audit-email" type="email" placeholder="email@exemplo.com" />
                  </div>
                  <SheetFooter>
                    <Button size="sm">Confirmar</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </DataBoard>

          <DataBoard title="AlertDialog (confirmação destrutiva)">
            <div className="p-4 space-y-3">
              <p className="text-[12px] text-muted-foreground">
                Garante que ações destrutivas exigem confirmação explícita.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">Excluir (teste)</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta é uma confirmação de teste. Nada será removido.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setStatus('alert', 'pass')}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DataBoard>

          <DataBoard title="Toasts">
            <div className="p-4 space-y-3">
              <p className="text-[12px] text-muted-foreground">
                Dispara notificações nos dois sistemas (shadcn + sonner).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    toast({ title: 'Toast OK', description: 'Sistema shadcn funcionando.' });
                    setStatus('toast', 'pass');
                  }}
                >
                  Disparar toast
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sonnerToast.success('Sonner OK', { description: 'Notificação enviada.' });
                    setStatus('sonner', 'pass');
                  }}
                >
                  Disparar sonner
                </Button>
              </div>
            </div>
          </DataBoard>
        </div>
      )}

      {activeTab === 'states' && (
        <div className="grid gap-4 md:grid-cols-2">
          <DataBoard title="Loading">
            <div className="p-4 space-y-3">
              <ActionToolbar
                left={
                  <>
                    {(['skeleton', 'spinner', 'cards'] as const).map((v) => (
                      <Button
                        key={v}
                        size="sm"
                        variant={loadingVariant === v ? 'default' : 'outline'}
                        className="h-7 text-[11px]"
                        onClick={() => {
                          setLoadingVariant(v);
                          setShowLoading(true);
                          setStatus(`loading-${v}`, 'pass');
                        }}
                      >
                        {v}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px]"
                      onClick={() => setShowLoading(false)}
                    >
                      Limpar
                    </Button>
                  </>
                }
              />
              {showLoading ? (
                <LoadingState variant={loadingVariant} />
              ) : (
                <p className="text-[12px] text-muted-foreground py-6 text-center">
                  Selecione uma variante para visualizar.
                </p>
              )}
            </div>
          </DataBoard>

          <DataBoard title="Empty">
            <div className="p-4 space-y-3">
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    setShowEmpty(true);
                    setStatus('empty', 'pass');
                  }}
                >
                  Mostrar EmptyState
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px]"
                  onClick={() => setShowEmpty(false)}
                >
                  Ocultar
                </Button>
              </div>
              {showEmpty && (
                <EmptyState
                  icon={faUsers}
                  title="Nenhum registro encontrado"
                  description="Este é um exemplo de estado vazio para inspeção visual."
                  action={
                    <Button size="sm">
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3 mr-1" />
                      Criar novo
                    </Button>
                  }
                />
              )}
            </div>
          </DataBoard>
        </div>
      )}

      {activeTab === 'tokens' && (
        <div className="grid gap-4 md:grid-cols-2">
          <DataBoard title="StatusBadge — variantes">
            <div className="p-4 flex flex-wrap gap-2" onMouseEnter={() => setStatus('badges', 'pass')}>
              {statusVariants.map((v) => (
                <StatusBadge key={v} variant={v}>
                  {v}
                </StatusBadge>
              ))}
            </div>
          </DataBoard>

          <DataBoard title="UserAvatar">
            <div className="p-4 flex flex-wrap items-center gap-3" onMouseEnter={() => setStatus('avatar', 'pass')}>
              {['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Reis', 'Eva Mota'].map((n) => (
                <div key={n} className="flex flex-col items-center gap-1">
                  <UserAvatar name={n} />
                  <span className="text-[11px] text-muted-foreground">{n.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </DataBoard>

          <DataBoard title="Tipografia">
            <div className="p-4 space-y-2">
              <h1 className="text-lg font-semibold">H1 — 18px semibold</h1>
              <h2 className="text-base font-semibold">H2 — 16px semibold</h2>
              <p className="text-[13px]">Body 13px — texto padrão de tabelas e listas.</p>
              <p className="text-[12px] text-muted-foreground">Caption 12px muted.</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Label 11px upper</p>
            </div>
          </DataBoard>

          <DataBoard title="Badges shadcn">
            <div className="p-4 flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </DataBoard>
        </div>
      )}

      <p
        className="text-[11px] text-muted-foreground text-center pt-2"
        onMouseEnter={() => setStatus('tabs', 'pass')}
      >
        Página de auditoria interna — sem efeito sobre dados de produção.
      </p>
    </div>
  );
}
