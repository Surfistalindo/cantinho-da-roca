import { cn } from '@/lib/utils';

interface Props {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}

/**
 * Aliases para nomes vindos de outras libs (ex.: Lucide) ou kebab-case
 * que não existem no Material Symbols. Mapeia para o nome correto.
 */
const ALIAS: Record<string, string> = {
  users: 'group',
  user: 'person',
  'user-check': 'how_to_reg',
  'user-plus': 'person_add',
  kanban: 'view_kanban',
  'file-spreadsheet': 'table_chart',
  'file-text': 'description',
  clipboard: 'content_paste',
  'message-circle': 'chat',
  'message-square': 'chat_bubble',
  copy: 'content_copy',
  tag: 'sell',
  'trending-up': 'trending_up',
  lightbulb: 'lightbulb',
  bot: 'smart_toy',
  sparkles: 'auto_awesome',
  briefcase: 'work',
  'check-square': 'check_box',
  square: 'crop_square',
  star: 'star',
  folder: 'folder',
  plus: 'add',
  trash: 'delete',
  'trash-2': 'delete',
  search: 'search',
  settings: 'settings',
};

const normalize = (name: string) => {
  if (ALIAS[name]) return ALIAS[name];
  // Material Symbols usa snake_case; converte kebab-case se vier solto.
  return name.replace(/-/g, '_');
};

/** Lightweight wrapper around Google Material Symbols Outlined. */
export function MSym({ name, className, filled, size }: Props) {
  return (
    <span
      className={cn('material-symbols-outlined', filled && 'msym-fill', className)}
      style={size ? { fontSize: `${size}px` } : undefined}
      aria-hidden
    >
      {normalize(name)}
    </span>
  );
}

