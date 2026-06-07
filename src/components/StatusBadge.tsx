import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'equipment' | 'rental' | 'damage' | 'maintenance' | 'inventory';
}

const statusStyles: Record<string, Record<string, string>> = {
  equipment: {
    available: 'bg-green-100 text-green-700',
    rented: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-amber-100 text-amber-700',
    damaged: 'bg-red-100 text-red-700',
    scrapped: 'bg-gray-100 text-gray-700',
  },
  rental: {
    pending: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    returned: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  },
  damage: {
    minor: 'bg-green-100 text-green-700',
    moderate: 'bg-amber-100 text-amber-700',
    severe: 'bg-red-100 text-red-700',
  },
  maintenance: {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
  },
  inventory: {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  },
};

const statusLabels: Record<string, Record<string, string>> = {
  equipment: {
    available: '在库可用',
    rented: '已租出',
    maintenance: '维护中',
    damaged: '损坏待修',
    scrapped: '已报废',
  },
  rental: {
    pending: '待取货',
    active: '租赁中',
    returned: '已归还',
    overdue: '已逾期',
    cancelled: '已取消',
  },
  damage: {
    minor: '轻微',
    moderate: '中等',
    severe: '严重',
  },
  maintenance: {
    pending: '待处理',
    in_progress: '维护中',
    completed: '已完成',
    cancelled: '已取消',
  },
  inventory: {
    pending: '待盘点',
    in_progress: '盘点中',
    completed: '已完成',
  },
};

export default function StatusBadge({ status, variant = 'equipment' }: StatusBadgeProps) {
  const styles = statusStyles[variant]?.[status] || 'bg-gray-100 text-gray-700';
  const label = statusLabels[variant]?.[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        styles
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', {
        'bg-green-500': status === 'available' || status === 'active' || status === 'returned' || status === 'completed' || status === 'minor',
        'bg-amber-500': status === 'pending' || status === 'maintenance' || status === 'moderate' || status === 'in_progress',
        'bg-red-500': status === 'damaged' || status === 'overdue' || status === 'severe',
        'bg-blue-500': status === 'rented',
        'bg-gray-500': status === 'scrapped' || status === 'cancelled',
      })}></span>
      {label}
    </span>
  );
}
