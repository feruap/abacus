
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'success':
      case 'instock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'error':
      case 'outofstock':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'escalated':
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved':
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Badge
      variant={variant}
      className={cn('font-medium', getStatusColor(status))}
    >
      {status}
    </Badge>
  );
}
