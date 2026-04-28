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
    <div className="text-center py-10 px-6">
      <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center ring-4 ring-muted/40">
        <FontAwesomeIcon icon={icon} className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-[12px] text-muted-foreground mt-1 max-w-sm mx-auto leading-snug">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
