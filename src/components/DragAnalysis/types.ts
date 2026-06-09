export type FieldType = 'dimension' | 'measure';

export type AggregationType = 'sum' | 'avg' | 'count' | 'max' | 'min';

export type ChartType =
  | 'bar'
  | 'line'
  | 'stackedBar'
  | 'dualAxis'
  | 'scatter'
  | 'heatmap'
  | 'funnel'
  | 'sankey';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  dataType: 'string' | 'number' | 'date';
  source: string;
  description?: string;
}

export interface ConfigField extends Field {
  aggregation?: AggregationType;
  color?: string;
  axis?: 'left' | 'right';
}

export interface FilterCondition {
  fieldId: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface AnalysisConfig {
  xAxis: ConfigField[];
  yAxis: ConfigField[];
  legend: ConfigField[];
  filters: FilterCondition[];
  chartType: ChartType;
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface SankeyNode {
  name: string;
  category?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface FunnelItem {
  name: string;
  value: number;
}

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: '柱状图',
  line: '折线图',
  stackedBar: '堆叠柱状图',
  dualAxis: '双轴图',
  scatter: '散点图',
  heatmap: '热力图',
  funnel: '漏斗图',
  sankey: '桑基图',
};

export const AGGREGATION_LABELS: Record<AggregationType, string> = {
  sum: '求和',
  avg: '平均值',
  count: '计数',
  max: '最大值',
  min: '最小值',
};
