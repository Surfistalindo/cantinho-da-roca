import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { workspaceService } from '@/services/workspaceService';
import { boardService } from '@/services/boardService';

type SeedBoard = {
  name: string;
  icon: string;
  color?: string;
  kind: 'route' | 'task_board';
  route_path?: string;
};

type SeedWorkspace = {
  name: string;
  icon: string;
  color: string;
  is_active?: boolean;
  boards: SeedBoard[];
};

const SEED: SeedWorkspace[] = [
  {
    name: 'CRM Operacional',
    icon: 'briefcase',
    color: '#a3613a',
    is_active: true,
    boards: [
      { name: 'Página inicial', icon: 'home', kind: 'route', route_path: '/admin/dashboard' },
      { name: 'Leads', icon: 'users', kind: 'route', route_path: '/admin/leads' },
      { name: 'Pipeline', icon: 'kanban', kind: 'route', route_path: '/admin/pipeline' },
      { name: 'Clientes', icon: 'user-check', kind: 'route', route_path: '/admin/clients' },
    ],
  },
  {
    name: 'Importação IA',
    icon: 'sparkles',
    color: '#5a7048',
    boards: [
      { name: 'Visão geral', icon: 'sparkles', kind: 'route', route_path: '/admin/ia' },
      { name: 'Excel', icon: 'file-spreadsheet', kind: 'route', route_path: '/admin/ia/excel' },
      { name: 'CSV', icon: 'file-text', kind: 'route', route_path: '/admin/ia/csv' },
      { name: 'Colar texto', icon: 'clipboard', kind: 'route', route_path: '/admin/ia/paste' },
      { name: 'WhatsApp', icon: 'message-circle', kind: 'route', route_path: '/admin/ia/whatsapp' },
      { name: 'Duplicados', icon: 'copy', kind: 'route', route_path: '/admin/ia/duplicates' },
      { name: 'Classificar', icon: 'tag', kind: 'route', route_path: '/admin/ia/classify' },
      { name: 'Score', icon: 'trending-up', kind: 'route', route_path: '/admin/ia/score' },
      { name: 'Insights', icon: 'lightbulb', kind: 'route', route_path: '/admin/ia/insights' },
      { name: 'Assistente', icon: 'bot', kind: 'route', route_path: '/admin/ia/assistant' },
    ],
  },
  {
    name: 'Tarefas internas',
    icon: 'check-square',
    color: '#c8941f',
    boards: [
      { name: 'Minhas tarefas', icon: 'check-square', kind: 'task_board' },
    ],
  },
];

export function useEnsureDefaultWorkspaces() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;

      const existing = await workspaceService.list();
      if (existing.length > 0) return;

      for (const ws of SEED) {
        const created = await workspaceService.create({
          name: ws.name,
          icon: ws.icon,
          color: ws.color,
        });
        if (ws.is_active) {
          await workspaceService.setActive(created.id);
        }
        for (const b of ws.boards) {
          await boardService.create({
            workspace_id: created.id,
            name: b.name,
            icon: b.icon,
            color: b.color,
            kind: b.kind,
            route_path: b.route_path ?? null,
          });
        }
      }
    })().catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[useEnsureDefaultWorkspaces]', e);
    });
  }, []);
}
