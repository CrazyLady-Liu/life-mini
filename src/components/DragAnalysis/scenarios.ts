import type { ScenarioTemplate } from './types';

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'sankey-rental-flow',
    name: '租赁流向分析',
    description: '客户类型 → 租赁套餐 → 装备分类，洞察租赁转化路径',
    category: 'flow',
    chartType: 'sankey',
    icon: 'git-branch',
    xAxisFields: [
      { fieldId: 'customerType' },
      { fieldId: 'packageType' },
    ],
    yAxisFields: [
      { fieldId: 'rentalCount', aggregation: 'sum' },
    ],
    legendFields: [
      { fieldId: 'category' },
    ],
    tips: '适合分析客户从来源到最终租赁装备的转化路径，帮助优化营销策略',
    recommended: true,
  },
  {
    id: 'heatmap-usage-frequency',
    name: '使用频次热力图',
    description: '月份 × 装备分类，直观展示各分类装备的使用热度',
    category: 'distribution',
    chartType: 'heatmap',
    icon: 'grid-3x3',
    xAxisFields: [
      { fieldId: 'month' },
      { fieldId: 'category' },
    ],
    yAxisFields: [
      { fieldId: 'rentalCount', aggregation: 'sum' },
    ],
    tips: '颜色越深表示使用频次越高，可用于发现季节性需求规律',
    recommended: true,
  },
  {
    id: 'scatter-cost-revenue',
    name: '装备性价比分析',
    description: '采购成本 VS 租赁收入，快速识别高回报装备',
    category: 'performance',
    chartType: 'scatter',
    icon: 'circle-dot',
    xAxisFields: [
      { fieldId: 'purchasePrice', aggregation: 'avg' },
    ],
    yAxisFields: [
      { fieldId: 'totalRevenue', aggregation: 'sum' },
    ],
    legendFields: [
      { fieldId: 'category' },
    ],
    tips: '右上角的装备属于高投入高回报，左下角属于低投入低回报',
    recommended: true,
  },
  {
    id: 'bar-category-revenue',
    name: '分类收入排行',
    description: '各装备分类租赁收入对比，一目了然',
    category: 'comparison',
    chartType: 'bar',
    icon: 'bar-chart-3',
    xAxisFields: [
      { fieldId: 'category' },
    ],
    yAxisFields: [
      { fieldId: 'rentalRevenue', aggregation: 'sum' },
    ],
    tips: '快速了解哪些装备分类贡献最多收入',
  },
  {
    id: 'line-monthly-trend',
    name: '月度租赁趋势',
    description: '按月查看租赁次数和收入变化趋势',
    category: 'trend',
    chartType: 'line',
    icon: 'trending-up',
    xAxisFields: [
      { fieldId: 'month' },
    ],
    yAxisFields: [
      { fieldId: 'rentalCount', aggregation: 'sum' },
      { fieldId: 'rentalRevenue', aggregation: 'sum' },
    ],
    tips: '观察业务的季节性波动，为采购和营销计划提供依据',
  },
  {
    id: 'stacked-category-by-status',
    name: '装备状态分布',
    description: '各分类装备状态堆叠对比，了解库存健康度',
    category: 'distribution',
    chartType: 'stackedBar',
    icon: 'layers',
    xAxisFields: [
      { fieldId: 'category' },
    ],
    yAxisFields: [
      { fieldId: 'equipmentCount', aggregation: 'sum' },
    ],
    legendFields: [
      { fieldId: 'status' },
    ],
    tips: '堆叠柱状图可以同时展示总量和各状态占比',
  },
  {
    id: 'dual-axis-revenue-count',
    name: '收入与频次双轴',
    description: '同时查看租赁次数和收入，双轴展示更直观',
    category: 'comparison',
    chartType: 'dualAxis',
    icon: 'activity',
    xAxisFields: [
      { fieldId: 'month' },
    ],
    yAxisFields: [
      { fieldId: 'rentalCount', aggregation: 'sum' },
      { fieldId: 'rentalRevenue', aggregation: 'sum' },
    ],
    tips: '左轴显示租赁次数（柱状），右轴显示租赁收入（折线）',
  },
  {
    id: 'funnel-customer-conversion',
    name: '客户转化漏斗',
    description: '从咨询到租赁的转化漏斗分析',
    category: 'flow',
    chartType: 'funnel',
    icon: 'funnel',
    xAxisFields: [
      { fieldId: 'customerType' },
    ],
    yAxisFields: [
      { fieldId: 'rentalCount', aggregation: 'sum' },
    ],
    tips: '漏斗图展示各阶段的转化情况，帮助发现流失环节',
  },
  {
    id: 'bar-brand-comparison',
    name: '品牌租赁对比',
    description: '各品牌装备租赁次数对比',
    category: 'comparison',
    chartType: 'bar',
    icon: 'bar-chart-3',
    xAxisFields: [
      { fieldId: 'brand' },
    ],
    yAxisFields: [
      { fieldId: 'rentalCount', aggregation: 'sum' },
    ],
    tips: '了解不同品牌的受欢迎程度，指导采购决策',
  },
  {
    id: 'line-quarterly-revenue',
    name: '季度收入趋势',
    description: '按季度汇总租赁收入，观察长期趋势',
    category: 'trend',
    chartType: 'line',
    icon: 'trending-up',
    xAxisFields: [
      { fieldId: 'quarter' },
    ],
    yAxisFields: [
      { fieldId: 'rentalRevenue', aggregation: 'sum' },
    ],
    legendFields: [
      { fieldId: 'year' },
    ],
    tips: '可对比不同年份同季度的收入变化',
  },
  {
    id: 'scatter-roi-analysis',
    name: '投资回报率分析',
    description: '采购成本 VS 投资回报率，评估装备效益',
    category: 'performance',
    chartType: 'scatter',
    icon: 'circle-dot',
    xAxisFields: [
      { fieldId: 'purchasePrice', aggregation: 'avg' },
    ],
    yAxisFields: [
      { fieldId: 'roi', aggregation: 'avg' },
    ],
    legendFields: [
      { fieldId: 'category' },
    ],
    tips: '高 ROI 且低成本的装备是最佳投资选择',
  },
  {
    id: 'heatmap-damage-category',
    name: '损耗热力分布',
    description: '装备分类 × 损耗等级，了解损耗分布情况',
    category: 'distribution',
    chartType: 'heatmap',
    icon: 'grid-3x3',
    xAxisFields: [
      { fieldId: 'category' },
      { fieldId: 'damageLevel' },
    ],
    yAxisFields: [
      { fieldId: 'damageCount', aggregation: 'sum' },
    ],
    tips: '帮助识别高损耗装备分类，优化维护策略',
  },
];

export const getScenarioById = (id: string): ScenarioTemplate | undefined => {
  return SCENARIO_TEMPLATES.find((s) => s.id === id);
};

export const getScenariosByCategory = (category: string): ScenarioTemplate[] => {
  return SCENARIO_TEMPLATES.filter((s) => s.category === category);
};
