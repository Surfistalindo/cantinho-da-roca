/**
 * Fonte única dos tipos de interação comercial.
 * Usado por LeadDetailSheet, CustomerDetailSheet e InteractionTimeline.
 */
import {
  faPhone,
  faCommentDots,
  faFileLines,
  faUsers,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface InteractionTypeConfig {
  value: string;
  label: string;
  icon: IconDefinition;
  /** Tailwind classes para o marcador circular (bg + text). */
  dotClass: string;
}

export const INTERACTION_TYPES: InteractionTypeConfig[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: faWhatsapp, dotClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  { value: 'ligação', label: 'Ligação', icon: faPhone, dotClass: 'bg-primary/15 text-primary' },
  { value: 'mensagem', label: 'Mensagem', icon: faCommentDots, dotClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { value: 'reunião', label: 'Reunião', icon: faUsers, dotClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  { value: 'observação', label: 'Observação', icon: faFileLines, dotClass: 'bg-muted text-muted-foreground' },
  { value: 'outro', label: 'Outro', icon: faCircleInfo, dotClass: 'bg-muted text-muted-foreground' },
];

const FALLBACK: InteractionTypeConfig = {
  value: 'outro',
  label: 'Outro',
  icon: faCircleInfo,
  dotClass: 'bg-muted text-muted-foreground',
};

export function getInteractionTypeConfig(value: string | null | undefined): InteractionTypeConfig {
  if (!value) return FALLBACK;
  return INTERACTION_TYPES.find((t) => t.value === value) ?? FALLBACK;
}
