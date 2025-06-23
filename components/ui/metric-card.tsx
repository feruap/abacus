
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
}: MetricCardProps) {
  const IconComponent = icon ? (Icons[icon as keyof typeof Icons] as any) : null;

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const TrendIcon = trend === 'up' ? Icons.TrendingUp : trend === 'down' ? Icons.TrendingDown : null;

  return (
    <Card className={cn('border-0 shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {IconComponent && (
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {trend && TrendIcon && (
              <>
                <TrendIcon className={cn('h-3 w-3', getTrendColor(trend))} />
                <span className={getTrendColor(trend)}>{trendValue}</span>
              </>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
