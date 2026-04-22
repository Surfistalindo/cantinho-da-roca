import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';

interface Props {
  icon?: IconDefinition;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon = faInbox, title, description, action }: Props) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-5 flex items-center justify-center ring-8 ring-muted/40">
        <FontAwesomeIcon icon={icon} className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
