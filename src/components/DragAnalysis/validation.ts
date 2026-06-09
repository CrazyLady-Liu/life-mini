import type { AnalysisConfig, ValidationResult, ChartType } from './types';
import { CHART_TYPE_LABELS } from './types';
import { getFieldById } from './fields';

const CHART_REQUIREMENTS: Record<ChartType, {
  xAxisType: 'dimension' | 'measure' | 'any';
  xAxisMin: number;
  xAxisMax: number;
  yAxisMin: number;
  yAxisMax: number;
  legendMax: number;
  legendType?: 'dimension' | 'measure';
}> = {
  bar: { xAxisType: 'dimension', xAxisMin: 1, xAxisMax: 2, yAxisMin: 1, yAxisMax: 5, legendMax: 1, legendType: 'dimension' },
  line: { xAxisType: 'dimension', xAxisMin: 1, xAxisMax: 2, yAxisMin: 1, yAxisMax: 5, legendMax: 1, legendType: 'dimension' },
  stackedBar: { xAxisType: 'dimension', xAxisMin: 1, xAxisMax: 2, yAxisMin: 1, yAxisMax: 3, legendMax: 1, legendType: 'dimension' },
  dualAxis: { xAxisType: 'dimension', xAxisMin: 1, xAxisMax: 1, yAxisMin: 2, yAxisMax: 2, legendMax: 0 },
  scatter: { xAxisType: 'measure', xAxisMin: 1, xAxisMax: 1, yAxisMin: 1, yAxisMax: 1, legendMax: 1, legendType: 'dimension' },
  heatmap: { xAxisType: 'dimension', xAxisMin: 2, xAxisMax: 2, yAxisMin: 1, yAxisMax: 1, legendMax: 0 },
  funnel: { xAxisType: 'dimension', xAxisMin: 1, xAxisMax: 1, yAxisMin: 1, yAxisMax: 1, legendMax: 0 },
  sankey: { xAxisType: 'dimension', xAxisMin: 2, xAxisMax: 5, yAxisMin: 1, yAxisMax: 1, legendMax: 1, legendType: 'dimension' },
};

export function validateConfig(config: AnalysisConfig): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];
  const req = CHART_REQUIREMENTS[config.chartType];
  const chartLabel = CHART_TYPE_LABELS[config.chartType];

  if (config.xAxis.length < req.xAxisMin) {
    errors.push({
      type: 'error',
      field: 'xAxis',
      message: `${chartLabel}至少需要 ${req.xAxisMin} 个 ${req.xAxisType === 'dimension' ? '维度' : '指标'} 字段`,
      suggestion: `请在 X 轴添加至少 ${req.xAxisMin} 个${req.xAxisType === 'dimension' ? '维度' : '指标'}`,
    });
  }
  if (config.xAxis.length > req.xAxisMax) {
    errors.push({
      type: 'error',
      field: 'xAxis',
      message: `${chartLabel}最多支持 ${req.xAxisMax} 个 X 轴字段`,
      suggestion: `请移除 ${config.xAxis.length - req.xAxisMax} 个字段`,
    });
  }

  if (config.yAxis.length < req.yAxisMin) {
    errors.push({
      type: 'error',
      field: 'yAxis',
      message: `${chartLabel}至少需要 ${req.yAxisMin} 个指标字段`,
      suggestion: `请在 Y 轴添加至少 ${req.yAxisMin} 个指标`,
    });
  }
  if (config.yAxis.length > req.yAxisMax) {
    errors.push({
      type: 'error',
      field: 'yAxis',
      message: `${chartLabel}最多支持 ${req.yAxisMax} 个 Y 轴字段`,
      suggestion: `请移除 ${config.yAxis.length - req.yAxisMax} 个指标`,
    });
  }

  if (config.legend.length > req.legendMax) {
    errors.push({
      type: 'error',
      field: 'legend',
      message: `${chartLabel}最多支持 ${req.legendMax} 个图例字段`,
      suggestion: `请移除 ${config.legend.length - req.legendMax} 个字段`,
    });
  }

  config.xAxis.forEach((field, index) => {
    if (req.xAxisType !== 'any' && field.type !== req.xAxisType) {
      errors.push({
        type: 'error',
        field: 'xAxis',
        message: `X轴字段「${field.name}」类型不匹配`,
        suggestion: `${chartLabel}的X轴需要${req.xAxisType === 'dimension' ? '维度' : '指标'}类型字段`,
      });
    }
  });

  config.yAxis.forEach((field) => {
    if (field.type !== 'measure') {
      errors.push({
        type: 'error',
        field: 'yAxis',
        message: `Y轴字段「${field.name}」必须是指标类型`,
        suggestion: '请将维度字段移至X轴或图例',
      });
    }
    if (field.type === 'measure' && !field.aggregation) {
      warnings.push({
        type: 'warning',
        field: 'yAxis',
        message: `指标「${field.name}」未设置聚合方式`,
        suggestion: '建议设置求和、平均值等聚合方式',
      });
    }
  });

  if (req.legendType && config.legend.length > 0) {
    config.legend.forEach((field) => {
      if (field.type !== req.legendType) {
        errors.push({
          type: 'error',
          field: 'legend',
          message: `图例字段「${field.name}」类型不匹配`,
          suggestion: `图例需要${req.legendType === 'dimension' ? '维度' : '指标'}类型字段`,
        });
      }
    });
  }

  const allFieldIds = [
    ...config.xAxis.map((f) => f.id),
    ...config.yAxis.map((f) => f.id),
    ...config.legend.map((f) => f.id),
  ];
  const uniqueIds = new Set(allFieldIds);
  if (uniqueIds.size !== allFieldIds.length) {
    warnings.push({
      type: 'warning',
      field: 'general',
      message: '存在重复的字段配置',
      suggestion: '重复的字段可能导致图表展示异常',
    });
  }

  config.filters.forEach((filter, index) => {
    const field = getFieldById(filter.fieldId);
    if (!field) {
      errors.push({
        type: 'error',
        field: 'filters',
        message: `筛选条件 ${index + 1} 引用了不存在的字段`,
        suggestion: '请重新选择筛选字段',
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function canChartAcceptXAxis(chartType: ChartType, fieldType: 'dimension' | 'measure'): boolean {
  const req = CHART_REQUIREMENTS[chartType];
  return req.xAxisType === 'any' || req.xAxisType === fieldType;
}

export function getChartRequirements(chartType: ChartType) {
  return CHART_REQUIREMENTS[chartType];
}
