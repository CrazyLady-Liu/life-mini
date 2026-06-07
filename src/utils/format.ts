export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const equipmentStatusLabels: Record<string, string> = {
  available: '在库可用',
  rented: '已租出',
  maintenance: '维护中',
  damaged: '损坏待修',
  scrapped: '已报废',
};

export const rentalStatusLabels: Record<string, string> = {
  pending: '待取货',
  active: '租赁中',
  returned: '已归还',
  overdue: '已逾期',
  cancelled: '已取消',
};

export const damageLevelLabels: Record<string, string> = {
  minor: '轻微',
  moderate: '中等',
  severe: '严重',
};

export const maintenanceStatusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '维护中',
  completed: '已完成',
  cancelled: '已取消',
};

export const inventoryCheckStatusLabels: Record<string, string> = {
  pending: '待盘点',
  in_progress: '盘点中',
  completed: '已完成',
};

export const equipmentCategories = [
  '帐篷',
  '睡袋',
  '防潮垫',
  '登山包',
  '登山杖',
  '炉具',
  '灯具',
  '桌椅',
  '天幕',
  '炊具',
  '其他',
];

export const maintenanceTypes = [
  '日常保养',
  '故障维修',
  '配件更换',
  '清洁消毒',
  '性能检测',
  '其他',
];
