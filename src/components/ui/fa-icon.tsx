import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { cn } from '@/lib/utils';

interface FaIconProps extends Omit<FontAwesomeIconProps, 'className'> {
  className?: string;
}

export default function FaIcon({ className, ...props }: FaIconProps) {
  return <FontAwesomeIcon className={cn(className)} {...props} />;
}
