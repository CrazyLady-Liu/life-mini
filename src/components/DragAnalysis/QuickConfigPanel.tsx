import { useMemo } from 'react';
import type { ScenarioTemplate, ConfigField, AggregationType } from './types';
import { CHART_TYPE_LABELS, AGGREGATION_LABELS } from './types';
import { DIMENSION_FIELDS, MEASURE_FIELDS, getFieldById } from './fields';
import { validateConfig } from './validation';
import {
  ArrowLeft,
  Settings2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Lightbulb,
  X,
} from 'lucide-react';

interface QuickConfigPanelProps {
  scenario: ScenarioTemplate;
  config: {
    xAxis: ConfigField[];
    yAxis: ConfigField[];
    legend: ConfigField[];
  };
  onConfigChange: (config: {
    xAxis: ConfigField[];
    yAxis: ConfigField[];
    legend: ConfigField[];
  }) => void;
  onBack: () => void;
  onAdvancedConfig: () => void;
  onViewChart: () => void;
}

export default function QuickConfigPanel({
  scenario,
  config,
  onConfigChange,
  onBack,
  onAdvancedConfig,
  onViewChart,
}: QuickConfigPanelProps) {
  const validation = useMemo(() => {
    return validateConfig({
      ...config,
      chartType: scenario.chartType,
      filters: [],
    });
  }, [config, scenario.chartType]);

  const xAxisFields = scenario.chartType === 'scatter' ? MEASURE_FIELDS : DIMENSION_FIELDS;
  const yAxisFields = MEASURE_FIELDS;
  const legendFields = DIMENSION_FIELDS;

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

  const addYAxisField = () => {
    if (config.yAxis.length >= 5) return;
    const firstAvailable = MEASURE_FIELDS.find(
      (f) => !config.yAxis.some((yf) => yf.id === f.id)
    );
    if (firstAvailable) {
      onConfigChange({
        ...config,
        yAxis: [...config.yAxis, { ...firstAvailable, aggregation: 'sum' }],
      });
    }
  };

  const removeYAxisField = (index: number) => {
    if (config.yAxis.length <= 1) return;
    const newYAxis = config.yAxis.filter((_, i) => i !== index);
    onConfigChange({ ...config, yAxis: newYAxis });
  };

  const needsLegend = scenario.legendFields && scenario.legendFields.length > 0;
  const xAxisLabel = scenario.chartType === 'scatter' ? 'X轴指标' : 'X轴维度';

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
          <h3 className="font-semibold text-gray-800">{scenario.name}</h3>
          <p className="text-xs text-gray-500">{CHART_TYPE_LABELS[scenario.chartType]} · 快速配置</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {scenario.tips && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">分析提示</p>
              <p className="text-xs text-amber-600 mt-0.5">{scenario.tips}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-md flex items-center justify-center text-xs font-bold">1</span>
                {xAxisLabel}
                <span className="text-xs text-gray-400 font-normal">
                  ({config.xAxis.length}个)
                </span>
              </label>
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
                        onChange={(e) => handleAggregationChange('x', index, e.target.value as AggregationType)}
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
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center text-xs font-bold">2</span>
                Y轴指标
                <span className="text-xs text-gray-400 font-normal">
                  ({config.yAxis.length}个)
                </span>
              </label>
              {config.yAxis.length < 5 && (
                <button
                  onClick={addYAxisField}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + 添加指标
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
                      {yAxisFields.map((f) => (
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
                      onChange={(e) => handleAggregationChange('y', index, e.target.value as AggregationType)}
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
                  {config.yAxis.length > 1 && (
                    <button
                      onClick={() => removeYAxisField(index)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {needsLegend && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center text-xs font-bold">3</span>
                  图例维度
                  <span className="text-xs text-gray-400 font-normal">(可选)</span>
                </label>
              </div>
              
              <div className="relative">
                <select
                  value={config.legend[0]?.id || ''}
                  onChange={(e) => handleLegendChange(e.target.value || null)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="">无图例</option>
                  {legendFields.map((f) => (
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

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            {validation.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${validation.valid ? 'text-emerald-600' : 'text-red-600'}`}>
              {validation.valid ? '配置有效' : '配置有问题'}
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
        <div className="flex gap-3">
          <button
            onClick={onAdvancedConfig}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            <span className="text-sm font-medium">高级配置</span>
          </button>
          <button
            onClick={onViewChart}
            disabled={!validation.valid}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
              validation.valid
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">生成图表</span>
          </button>
        </div>
      </div>
    </div>
  );
}
