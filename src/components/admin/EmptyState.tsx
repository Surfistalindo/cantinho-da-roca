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
    <div className="text-center py-12 px-4">
      <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
        <FontAwesomeIcon icon={icon} className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
