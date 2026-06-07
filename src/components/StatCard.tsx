import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'emerald' | 'amber' | 'blue' | 'red' | 'purple';
}

const colorClasses = {
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  blue: 'from-blue-500 to-blue-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
};

const bgColorClasses = {
  emerald: 'bg-emerald-50',
  amber: 'bg-amber-50',
  blue: 'bg-blue-50',
  red: 'bg-red-50',
  purple: 'bg-purple-50',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'emerald',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                trendUp ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
            colorClasses[color]
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
