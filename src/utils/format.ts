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

export const depositStatusLabels: Record<string, string> = {
  pending: '待收取',
  collected: '已预收',
  refunded_full: '全额退还',
  refunded_partial: '部分扣除',
  forfeited: '全额没收',
};

export const depositRuleTypeLabels: Record<string, string> = {
  category: '分类押金',
  equipment: '单件押金',
  package: '套餐押金',
};

export const transactionTypeLabels: Record<string, string> = {
  deposit_collect: '押金收取',
  deposit_refund: '押金退还',
  deposit_forfeit: '押金没收',
  penalty: '违约金',
  rental_fee: '租赁费用',
  damage_compensation: '损坏赔偿',
};

export const equipmentValueLevelLabels: Record<string, string> = {
  normal: '普通装备',
  high: '高价值装备',
};

export const highValueThreshold = 800;
