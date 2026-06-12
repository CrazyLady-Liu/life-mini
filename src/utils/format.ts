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

export const customerChannelLabels: Record<string, string> = {
  individual: '散客',
  group: '团建',
  online: '线上渠道',
};

export const transactionTypeLabels: Record<string, string> = {
  deposit_collect: '押金收取',
  deposit_refund: '押金退还',
  deposit_forfeit: '押金没收',
  deposit_offset: '押金抵扣',
  penalty: '逾期违约金',
  rental_fee: '租赁费用',
  rental_renewal_fee: '续租费用',
  damage_compensation: '损坏赔偿',
  loss_compensation: '丢失赔款',
  package_discount: '套餐优惠抵扣',
  coupon_discount: '优惠券抵扣',
  delivery_fee: '配送费',
  cleaning_fee: '清洁费',
  packing_fee: '装备打包费',
  refund_rental: '租金退款',
};

export const equipmentValueLevelLabels: Record<string, string> = {
  normal: '普通装备',
  high: '高价值装备',
};

export const highValueThreshold = 800;

export const financeCategoryLabels: Record<string, string> = {
  rental_income: '租金收入',
  deposit_income: '押金收入',
  deposit_refund: '押金退还',
  deposit_offset_income: '押金抵扣收入',
  penalty_income: '违约金收入',
  damage_compensation: '损坏赔偿',
  loss_compensation: '丢失赔款',
  discount: '优惠抵扣',
  delivery_fee: '配送费用',
  cleaning_fee: '清洁费用',
  packing_fee: '打包服务',
  value_added_service: '增值服务费',
  other: '其他',
};

export const voucherStatusLabels: Record<string, string> = {
  pending: '待开票',
  issued: '已开票',
  cancelled: '已作废',
};

export const depositFlowTypeLabels: Record<string, string> = {
  deposit_collect: '押金预收',
  deposit_refund_full: '押金全额退还',
  deposit_refund_partial: '押金部分抵扣退还',
  deposit_offset: '押金抵扣赔付',
};

export const depositFlowTypeColors: Record<string, { bg: string; text: string }> = {
  deposit_collect: { bg: 'bg-amber-100', text: 'text-amber-700' },
  deposit_refund_full: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  deposit_refund_partial: { bg: 'bg-blue-100', text: 'text-blue-700' },
  deposit_offset: { bg: 'bg-rose-100', text: 'text-rose-700' },
};
