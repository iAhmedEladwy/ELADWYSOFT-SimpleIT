import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/lib/currencyContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change: string;
  changeLabel: string;
  changeColor?: 'success' | 'warning' | 'error';
  iconColor?: 'primary' | 'secondary' | 'accent' | 'warning';
  isCurrency?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  changeColor = 'success',
  iconColor = 'primary',
  isCurrency = false
}: StatsCardProps) {
  // Use currency context to format values if needed
  const { formatCurrency } = useCurrency();
  const getChangeColor = () => {
    switch (changeColor) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-success';
    }
  };

  const getIconColor = () => {
    switch (iconColor) {
      case 'primary': return 'bg-primary bg-opacity-10 text-primary';
      case 'secondary': return 'bg-secondary bg-opacity-10 text-secondary';
      case 'accent': return 'bg-accent bg-opacity-10 text-accent';
      case 'warning': return 'bg-warning bg-opacity-10 text-warning';
      default: return 'bg-primary bg-opacity-10 text-primary';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">
            {isCurrency && typeof value === 'number' ? formatCurrency(value) : value}
          </h3>
        </div>
        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", getIconColor())}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className={cn("font-medium", getChangeColor())}>{change}</span>
        <span className="text-gray-500 ml-2">{changeLabel}</span>
      </div>
    </div>
  );
}
