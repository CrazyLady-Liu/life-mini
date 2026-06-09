import { useMemo, useState } from 'react';
import type {
  AnalysisConfig,
  ChartType,
  ConfigField,
  FilterCondition,
  AggregationType,
} from './types';
import { CHART_TYPE_LABELS, AGGREGATION_LABELS } from './types';
import { DIMENSION_FIELDS, MEASURE_FIELDS, getFieldById } from './fields';
import { validateConfig, getChartRequirements } from './validation';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Layers,
  Activity,
  CircleDot,
  Grid3X3,
  Funnel,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Plus,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

interface AdvancedConfigPanelProps {
  config: AnalysisConfig;
  onConfigChange: (config: AnalysisConfig) => void;
  onBack: () => void;
  onViewChart: () => void;
}

const CHART_TYPE_OPTIONS: { type: ChartType; icon: React.ReactNode; desc: string }[] = [
  { type: 'bar', icon: <BarChart3 className="w-5 h-5" />, desc: '适合类别对比' },
  { type: 'line', icon: <TrendingUp className="w-5 h-5" />, desc: '适合趋势分析' },
  { type: 'stackedBar', icon: <Layers className="w-5 h-5" />, desc: '适合堆叠对比' },
  { type: 'dualAxis', icon: <Activity className="w-5 h-5" />, desc: '双指标对比' },
  { type: 'scatter', icon: <CircleDot className="w-5 h-5" />, desc: '相关性分析' },
  { type: 'heatmap', icon: <Grid3X3 className="w-5 h-5" />, desc: '矩阵热力分布' },
  { type: 'funnel', icon: <Funnel className="w-5 h-5" />, desc: '转化漏斗分析' },
  { type: 'sankey', icon: <GitBranch className="w-5 h-5" />, desc: '流向路径分析' },
];

export default function AdvancedConfigPanel({
  config,
  onConfigChange,
  onBack,
  onViewChart,
}: AdvancedConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'data' | 'filters'>('basic');

  const validation = useMemo(() => validateConfig(config), [config]);
  const requirements = useMemo(() => getChartRequirements(config.chartType), [config.chartType]);

  const xAxisFields = config.chartType === 'scatter' ? MEASURE_FIELDS : DIMENSION_FIELDS;
  const xAxisLabel = config.chartType === 'scatter' ? 'X轴指标' : 'X轴维度';

  const handleChartTypeChange = (chartType: ChartType) => {
    const newReq = getChartRequirements(chartType);
    let newXAxis = config.xAxis;
    let newYAxis = config.yAxis;
    let newLegend = config.legend;

    if (chartType === 'scatter') {
      newXAxis = config.xAxis.filter((f) => f.type === 'measure').slice(0, 1);
      if (newXAxis.length === 0 && config.yAxis.length > 0) {
        newXAxis = [config.yAxis[0]];
        newYAxis = config.yAxis.slice(1, 2);
      }
      if (newYAxis.length === 0) {
        newYAxis = MEASURE_FIELDS.slice(0, 1).map((f) => ({ ...f, aggregation: 'sum' as AggregationType }));
      }
    } else if (chartType === 'heatmap') {
      const allDims = [...config.xAxis, ...config.legend].filter((f) => f.type === 'dimension');
      newXAxis = allDims.slice(0, 2);
      if (newXAxis.length < 2) {
        const needed = 2 - newXAxis.length;
        newXAxis = [...newXAxis, ...DIMENSION_FIELDS.slice(0, needed)];
      }
      newYAxis = config.yAxis.slice(0, 1);
      if (newYAxis.length === 0) {
        newYAxis = MEASURE_FIELDS.slice(0, 1).map((f) => ({ ...f, aggregation: 'sum' as AggregationType }));
      }
      newLegend = [];
    } else if (chartType === 'sankey') {
      const allDims = [...config.xAxis, ...config.legend].filter((f) => f.type === 'dimension');
      newXAxis = allDims.slice(0, 3);
      if (newXAxis.length < 2) {
        const needed = 2 - newXAxis.length;
        newXAxis = [...newXAxis, ...DIMENSION_FIELDS.slice(0, needed)];
      }
      newYAxis = config.yAxis.slice(0, 1);
      if (newYAxis.length === 0) {
        newYAxis = MEASURE_FIELDS.slice(0, 1).map((f) => ({ ...f, aggregation: 'sum' as AggregationType }));
      }
      newLegend = allDims.slice(3, 4);
    } else {
      newXAxis = config.xAxis.filter((f) => f.type === 'dimension').slice(0, 1);
      if (newXAxis.length === 0) {
        newXAxis = DIMENSION_FIELDS.slice(0, 1).map((f) => ({ ...f }));
      }
      newYAxis = config.yAxis.slice(0, newReq.yAxisMax);
      if (newYAxis.length < newReq.yAxisMin) {
        const needed = newReq.yAxisMin - newYAxis.length;
        const existingIds = new Set(newYAxis.map((f) => f.id));
        const available = MEASURE_FIELDS.filter((f) => !existingIds.has(f.id));
        newYAxis = [
          ...newYAxis,
          ...available.slice(0, needed).map((f) => ({ ...f, aggregation: 'sum' as AggregationType })),
        ];
      }
    }

    onConfigChange({
      ...config,
      chartType,
      xAxis: newXAxis as ConfigField[],
      yAxis: newYAxis as ConfigField[],
      legend: newLegend,
    });
  };

  const handleXAxisChange = (index: number, fieldId: string) => {
    const field = getFieldById(fieldId);
    if (!field) return;
    const newXAxis = [...config.xAxis];
    newXAxis[index] = {
      ...field,
      aggregation: field.type === 'measure' ? 'sum' : undefined,
    };
    onConfigChange({ ...config, xAxis: newXAxis });
  };

  const handleYAxisChange = (index: number, fieldId: string) => {
    const field = getFieldById(fieldId);
    if (!field) return;
    const newYAxis = [...config.yAxis];
    newYAxis[index] = { ...field, aggregation: 'sum' };
    onConfigChange({ ...config, yAxis: newYAxis });
  };

  const handleLegendChange = (fieldId: string | null) => {
    if (!fieldId) {
      onConfigChange({ ...config, legend: [] });
      return;
    }
    const field = getFieldById(fieldId);
    if (!field) return;
    onConfigChange({ ...config, legend: [field] });
  };

  const handleAggregationChange = (axis: 'x' | 'y', index: number, aggregation: AggregationType) => {
    if (axis === 'x') {
      const newXAxis = [...config.xAxis];
      newXAxis[index] = { ...newXAxis[index], aggregation };
      onConfigChange({ ...config, xAxis: newXAxis });
    } else {
      const newYAxis = [...config.yAxis];
      newYAxis[index] = { ...newYAxis[index], aggregation };
      onConfigChange({ ...config, yAxis: newYAxis });
    }
  };

  const addXAxisField = () => {
    if (config.xAxis.length >= requirements.xAxisMax) return;
    const existingIds = new Set(config.xAxis.map((f) => f.id));
    const available = xAxisFields.filter((f) => !existingIds.has(f.id));
    if (available.length === 0) return;
    const newField: ConfigField = {
      ...available[0],
      aggregation: available[0].type === 'measure' ? 'sum' : undefined,
    };
    onConfigChange({ ...config, xAxis: [...config.xAxis, newField] });
  };

  const removeXAxisField = (index: number) => {
    if (config.xAxis.length <= requirements.xAxisMin) return;
    onConfigChange({ ...config, xAxis: config.xAxis.filter((_, i) => i !== index) });
  };

  const addYAxisField = () => {
    if (config.yAxis.length >= requirements.yAxisMax) return;
    const existingIds = new Set(config.yAxis.map((f) => f.id));
    const available = MEASURE_FIELDS.filter((f) => !existingIds.has(f.id));
    if (available.length === 0) return;
    onConfigChange({
      ...config,
      yAxis: [...config.yAxis, { ...available[0], aggregation: 'sum' }],
    });
  };

  const removeYAxisField = (index: number) => {
    if (config.yAxis.length <= requirements.yAxisMin) return;
    onConfigChange({ ...config, yAxis: config.yAxis.filter((_, i) => i !== index) });
  };

  const addFilter = () => {
    const existingIds = new Set(config.filters.map((f) => f.fieldId));
    const available = DIMENSION_FIELDS.filter((f) => !existingIds.has(f.id));
    if (available.length === 0) return;
    const newFilter: FilterCondition = {
      fieldId: available[0].id,
      operator: 'eq',
      value: '',
    };
    onConfigChange({ ...config, filters: [...config.filters, newFilter] });
  };

  const removeFilter = (index: number) => {
    onConfigChange({ ...config, filters: config.filters.filter((_, i) => i !== index) });
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    const newFilters = [...config.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onConfigChange({ ...config, filters: newFilters });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-semibold text-gray-800">高级配置</h3>
          <p className="text-xs text-gray-500">自定义图表类型、维度、指标和筛选条件</p>
        </div>
      </div>

      <div className="flex border-b border-gray-100 px-6">
        {[
          { key: 'basic', label: '图表类型' },
          { key: 'data', label: '数据配置' },
          { key: 'filters', label: '筛选条件' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">选择图表类型</h4>
              <div className="grid grid-cols-2 gap-3">
                {CHART_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleChartTypeChange(option.type)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      config.chartType === option.type
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        config.chartType === option.type
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          config.chartType === option.type ? 'text-emerald-700' : 'text-gray-800'
                        }`}
                      >
                        {CHART_TYPE_LABELS[option.type]}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{option.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">配置要求</p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                    <li>• X轴: {requirements.xAxisMin}-{requirements.xAxisMax} 个{requirements.xAxisType === 'dimension' ? '维度' : requirements.xAxisType === 'measure' ? '指标' : '字段'}</li>
                    <li>• Y轴: {requirements.yAxisMin}-{requirements.yAxisMax} 个指标</li>
                    <li>• 图例: 最多 {requirements.legendMax} 个{requirements.legendType === 'dimension' ? '维度' : requirements.legendType === 'measure' ? '指标' : '字段'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {xAxisLabel}
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    ({config.xAxis.length}/{requirements.xAxisMax})
                  </span>
                </label>
                {config.xAxis.length < requirements.xAxisMax && (
                  <button
                    onClick={addXAxisField}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {config.xAxis.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <select
                        value={field.id}
                        onChange={(e) => handleXAxisChange(index, e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                      >
                        {xAxisFields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {field.type === 'measure' && (
                      <div className="relative">
                        <select
                          value={field.aggregation || 'sum'}
                          onChange={(e) =>
                            handleAggregationChange('x', index, e.target.value as AggregationType)
                          }
                          className="px-3 py-2.5 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                        >
                          {Object.entries(AGGREGATION_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                    {config.xAxis.length > requirements.xAxisMin && (
                      <button
                        onClick={() => removeXAxisField(index)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Y轴指标
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    ({config.yAxis.length}/{requirements.yAxisMax})
                  </span>
                </label>
                {config.yAxis.length < requirements.yAxisMax && (
                  <button
                    onClick={addYAxisField}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {config.yAxis.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <select
                        value={field.id}
                        onChange={(e) => handleYAxisChange(index, e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                      >
                        {MEASURE_FIELDS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={field.aggregation || 'sum'}
                        onChange={(e) =>
                          handleAggregationChange('y', index, e.target.value as AggregationType)
                        }
                        className="px-3 py-2.5 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                      >
                        {Object.entries(AGGREGATION_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {config.yAxis.length > requirements.yAxisMin && (
                      <button
                        onClick={() => removeYAxisField(index)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {requirements.legendMax > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  图例维度
                  <span className="text-xs text-gray-400 font-normal ml-2">(可选)</span>
                </label>
                <div className="relative">
                  <select
                    value={config.legend[0]?.id || ''}
                    onChange={(e) => handleLegendChange(e.target.value || null)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                  >
                    <option value="">无图例</option>
                    {DIMENSION_FIELDS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                筛选条件
                <span className="text-xs text-gray-400 font-normal ml-2">
                  ({config.filters.length}个)
                </span>
              </label>
              <button
                onClick={addFilter}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                添加筛选
              </button>
            </div>

            {config.filters.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">暂无筛选条件</p>
                <p className="text-xs text-gray-300 mt-1">点击上方「添加筛选」按钮添加</p>
              </div>
            ) : (
              <div className="space-y-3">
                {config.filters.map((filter, index) => {
                  const field = getFieldById(filter.fieldId);
                  return (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 relative">
                          <select
                            value={filter.fieldId}
                            onChange={(e) => updateFilter(index, { fieldId: e.target.value })}
                            className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                          >
                            {DIMENSION_FIELDS.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                          <select
                            value={filter.operator}
                            onChange={(e) =>
                              updateFilter(index, { operator: e.target.value as FilterCondition['operator'] })
                            }
                            className="px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                          >
                            <option value="eq">等于</option>
                            <option value="neq">不等于</option>
                            <option value="contains">包含</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => removeFilter(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder={`请输入${field?.name || '字段'}的值...`}
                        value={String(filter.value || '')}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            {validation.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                validation.valid ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {validation.valid ? '配置验证通过' : '配置存在问题'}
            </span>
          </div>

          {validation.errors.length > 0 && (
            <div className="space-y-1.5">
              {validation.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{err.message}</span>
                    {err.suggestion && (
                      <span className="block text-red-400 mt-0.5">{err.suggestion}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {validation.warnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{warn.message}</span>
                    {warn.suggestion && (
                      <span className="block text-amber-500/70 mt-0.5">{warn.suggestion}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <button
          onClick={onViewChart}
          disabled={!validation.valid}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
            validation.valid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">生成图表</span>
        </button>
      </div>
    </div>
  );
}
