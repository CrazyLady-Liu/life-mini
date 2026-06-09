import { useState, useMemo, useCallback } from 'react';
import ScenarioSelector from './ScenarioSelector';
import QuickConfigPanel from './QuickConfigPanel';
import AdvancedConfigPanel from './AdvancedConfigPanel';
import ChartRenderer from './ChartRenderer';
import type {
  Field,
  ConfigField,
  AnalysisConfig,
  ChartType,
  ScenarioTemplate,
  ViewMode,
} from './types';
import { CHART_TYPE_LABELS } from './types';
import {
  useJoinedData,
  generateChartData,
  generateSankeyData,
  generateHeatmapData,
  generateFunnelData,
  generateScatterData,
} from './dataUtils';
import { getFieldById } from './fields';
import {
  Sparkles,
  RefreshCcw,
  Download,
  Settings2,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Layers,
  Activity,
  CircleDot,
  Grid3X3,
  Funnel as FunnelIcon,
  GitBranch,
  SlidersHorizontal,
} from 'lucide-react';

interface DragAnalysisCanvasProps {
  initialConfig?: Partial<AnalysisConfig>;
}

const CHART_TYPE_ICONS: Record<ChartType, React.ReactNode> = {
  bar: <BarChart3 className="w-4 h-4" />,
  line: <TrendingUp className="w-4 h-4" />,
  stackedBar: <Layers className="w-4 h-4" />,
  dualAxis: <Activity className="w-4 h-4" />,
  scatter: <CircleDot className="w-4 h-4" />,
  heatmap: <Grid3X3 className="w-4 h-4" />,
  funnel: <FunnelIcon className="w-4 h-4" />,
  sankey: <GitBranch className="w-4 h-4" />,
};

const DEFAULT_CONFIG: AnalysisConfig = {
  xAxis: [],
  yAxis: [],
  legend: [],
  filters: [],
  chartType: 'bar',
};

function scenarioToConfig(scenario: ScenarioTemplate): AnalysisConfig {
  const xAxis: ConfigField[] = scenario.xAxisFields.map((f) => {
    const field = getFieldById(f.fieldId);
    return {
      ...field!,
      aggregation: f.aggregation,
    };
  });

  const yAxis: ConfigField[] = scenario.yAxisFields.map((f) => {
    const field = getFieldById(f.fieldId);
    return {
      ...field!,
      aggregation: f.aggregation || 'sum',
    };
  });

  const legend: ConfigField[] = (scenario.legendFields || []).map((f) => {
    const field = getFieldById(f.fieldId);
    return { ...field! };
  });

  return {
    xAxis,
    yAxis,
    legend,
    filters: scenario.filters || [],
    chartType: scenario.chartType,
  };
}

export default function DragAnalysisCanvas({ initialConfig }: DragAnalysisCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('scenario-select');
  const [currentScenario, setCurrentScenario] = useState<ScenarioTemplate | null>(null);
  const [config, setConfig] = useState<AnalysisConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const joinedData = useJoinedData();

  const chartData = useMemo(() => {
    if (config.chartType === 'scatter' || config.chartType === 'sankey' || config.chartType === 'heatmap' || config.chartType === 'funnel') {
      return [];
    }
    return generateChartData(joinedData, config);
  }, [joinedData, config]);

  const sankeyData = useMemo(() => {
    if (config.chartType !== 'sankey') return undefined;
    const dimFields = [...config.xAxis, ...config.legend].filter((f) => f.type === 'dimension');
    if (dimFields.length < 2) return undefined;
    return generateSankeyData(joinedData, dimFields);
  }, [joinedData, config]);

  const heatmapData = useMemo(() => {
    if (config.chartType !== 'heatmap') return undefined;
    if (config.xAxis.length < 2 || config.yAxis.length < 1) return undefined;
    return generateHeatmapData(joinedData, config.xAxis[0], config.xAxis[1], config.yAxis[0]);
  }, [joinedData, config]);

  const funnelData = useMemo(() => {
    if (config.chartType !== 'funnel') return undefined;
    if (config.xAxis.length < 1 || config.yAxis.length < 1) return undefined;
    return generateFunnelData(joinedData, config.xAxis[0], config.yAxis[0]);
  }, [joinedData, config]);

  const scatterData = useMemo(() => {
    if (config.chartType !== 'scatter') return undefined;
    if (config.xAxis.length < 1 || config.yAxis.length < 1) return undefined;
    return generateScatterData(
      joinedData,
      config.xAxis[0],
      config.yAxis[0],
      config.legend[0]
    );
  }, [joinedData, config]);

  const filterFieldNames = useMemo(() => {
    const map = new Map<string, string>();
    config.filters.forEach((f) => {
      const field = getFieldById(f.fieldId);
      if (field) {
        map.set(f.fieldId, field.name);
      }
    });
    config.xAxis.forEach((f) => map.set(f.id, f.name));
    config.yAxis.forEach((f) => map.set(f.id, f.name));
    config.legend.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [config.filters, config.xAxis, config.yAxis, config.legend]);

  const handleSelectScenario = useCallback((scenario: ScenarioTemplate) => {
    const newConfig = scenarioToConfig(scenario);
    setConfig(newConfig);
    setCurrentScenario(scenario);
    setViewMode('quick-config');
  }, []);

  const handleQuickConfigChange = useCallback((quickConfig: {
    xAxis: ConfigField[];
    yAxis: ConfigField[];
    legend: ConfigField[];
  }) => {
    setConfig((prev) => ({
      ...prev,
      ...quickConfig,
    }));
  }, []);

  const handleAdvancedConfig = useCallback(() => {
    setViewMode('advanced-config');
  }, []);

  const handleBackToScenarios = useCallback(() => {
    setViewMode('scenario-select');
    setCurrentScenario(null);
  }, []);

  const handleBackToQuickConfig = useCallback(() => {
    setViewMode('quick-config');
  }, []);

  const handleViewChart = useCallback(() => {
    setViewMode('chart-view');
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setCurrentScenario(null);
    setViewMode('scenario-select');
  }, []);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(
      {
        config,
        data: chartData,
        sankeyData,
        heatmapData,
        funnelData,
        scatterData,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [config, chartData, sankeyData, heatmapData, funnelData, scatterData]);

  const chartTypes: ChartType[] = [
    'bar',
    'line',
    'stackedBar',
    'dualAxis',
    'scatter',
    'heatmap',
    'funnel',
    'sankey',
  ];

  const handleChartTypeChange = useCallback((chartType: ChartType) => {
    setConfig((prev) => {
      let newXAxis = prev.xAxis;
      let newYAxis = prev.yAxis;
      let newLegend = prev.legend;

      if (chartType === 'scatter') {
        newXAxis = prev.xAxis.filter((f) => f.type === 'measure');
        if (newXAxis.length === 0 && prev.yAxis.length > 0) {
          newXAxis = [prev.yAxis[0]];
          newYAxis = prev.yAxis.slice(1);
        }
      } else if (chartType === 'sankey' || chartType === 'heatmap') {
        newYAxis = prev.yAxis.length > 0 ? [prev.yAxis[0]] : [];
        const allDims = [...prev.xAxis, ...prev.legend].filter((f) => f.type === 'dimension');
        if (chartType === 'heatmap') {
          newXAxis = allDims.slice(0, 2);
          newLegend = [];
        } else {
          newXAxis = allDims.slice(0, 3);
          newLegend = allDims.slice(3, 4);
        }
      } else {
        newXAxis = prev.xAxis.filter((f) => f.type === 'dimension').slice(0, 1);
        if (newXAxis.length === 0 && prev.legend.length > 0) {
          newXAxis = [prev.legend[0]];
          newLegend = [];
        }
      }

      return {
        ...prev,
        chartType,
        xAxis: newXAxis,
        yAxis: newYAxis,
        legend: newLegend,
      };
    });
  }, []);

  if (viewMode === 'scenario-select') {
    return (
      <div className="h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <ScenarioSelector
          onSelectScenario={handleSelectScenario}
          onAdvancedConfig={() => {
            setConfig({
              xAxis: [{ ...getFieldById('category')! }],
              yAxis: [{ ...getFieldById('rentalCount')!, aggregation: 'sum' }],
              legend: [],
              filters: [],
              chartType: 'bar',
            });
            handleAdvancedConfig();
          }}
        />
      </div>
    );
  }

  if (viewMode === 'quick-config' && currentScenario) {
    return (
      <div className="h-full flex gap-4 bg-gray-50 rounded-xl overflow-hidden p-4">
        <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <QuickConfigPanel
            scenario={currentScenario}
            config={{
              xAxis: config.xAxis,
              yAxis: config.yAxis,
              legend: config.legend,
            }}
            onConfigChange={handleQuickConfigChange}
            onBack={handleBackToScenarios}
            onAdvancedConfig={handleAdvancedConfig}
            onViewChart={handleViewChart}
          />
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
          <ChartPreview config={config} />
        </div>
      </div>
    );
  }

  if (viewMode === 'advanced-config') {
    return (
      <div className="h-full flex gap-4 bg-gray-50 rounded-xl overflow-hidden p-4">
        <div className="w-96 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <AdvancedConfigPanel
            config={config}
            onConfigChange={setConfig}
            onBack={currentScenario ? handleBackToQuickConfig : handleBackToScenarios}
            onViewChart={handleViewChart}
          />
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
          <ChartPreview config={config} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToScenarios}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentScenario?.name || '自助分析'}
            </h3>
            <p className="text-xs text-gray-500">
              {currentScenario?.description || '自定义分析图表'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('advanced-config')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            修改配置
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto flex-shrink-0">
        <span className="text-xs text-gray-500 font-medium flex-shrink-0">图表类型:</span>
        <div className="flex gap-1.5">
          {chartTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleChartTypeChange(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap ${
                config.chartType === type
                  ? 'bg-emerald-500 text-white shadow-sm font-medium'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {CHART_TYPE_ICONS[type]}
              {CHART_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 min-h-0">
        <div className="h-full bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <ChartRenderer
            chartType={config.chartType}
            data={chartData}
            sankeyData={sankeyData}
            heatmapData={heatmapData}
            funnelData={funnelData}
            scatterData={scatterData}
            xFields={config.xAxis}
            yFields={config.yAxis}
            legendFields={config.legend}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            X轴: {config.xAxis.map((f) => f.name).join(', ') || '未设置'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Y轴: {config.yAxis.map((f) => f.name).join(', ') || '未设置'}
          </span>
        </div>
        {config.legend.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              图例: {config.legend.map((f) => f.name).join(', ')}
            </span>
          </div>
        )}
        {config.filters.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              筛选: {config.filters.length}个条件
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartPreview({ config }: { config: AnalysisConfig }) {
  const joinedData = useJoinedData();

  const chartData = useMemo(() => {
    if (config.chartType === 'scatter' || config.chartType === 'sankey' || config.chartType === 'heatmap' || config.chartType === 'funnel') {
      return [];
    }
    return generateChartData(joinedData, config);
  }, [joinedData, config]);

  const sankeyData = useMemo(() => {
    if (config.chartType !== 'sankey') return undefined;
    const dimFields = [...config.xAxis, ...config.legend].filter((f) => f.type === 'dimension');
    if (dimFields.length < 2) return undefined;
    return generateSankeyData(joinedData, dimFields);
  }, [joinedData, config]);

  const heatmapData = useMemo(() => {
    if (config.chartType !== 'heatmap') return undefined;
    if (config.xAxis.length < 2 || config.yAxis.length < 1) return undefined;
    return generateHeatmapData(joinedData, config.xAxis[0], config.xAxis[1], config.yAxis[0]);
  }, [joinedData, config]);

  const funnelData = useMemo(() => {
    if (config.chartType !== 'funnel') return undefined;
    if (config.xAxis.length < 1 || config.yAxis.length < 1) return undefined;
    return generateFunnelData(joinedData, config.xAxis[0], config.yAxis[0]);
  }, [joinedData, config]);

  const scatterData = useMemo(() => {
    if (config.chartType !== 'scatter') return undefined;
    if (config.xAxis.length < 1 || config.yAxis.length < 1) return undefined;
    return generateScatterData(
      joinedData,
      config.xAxis[0],
      config.yAxis[0],
      config.legend[0]
    );
  }, [joinedData, config]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 font-medium">实时预览</p>
      </div>
      <div className="flex-1 p-4 min-h-0">
        <ChartRenderer
          chartType={config.chartType}
          data={chartData}
          sankeyData={sankeyData}
          heatmapData={heatmapData}
          funnelData={funnelData}
          scatterData={scatterData}
          xFields={config.xAxis}
          yFields={config.yAxis}
          legendFields={config.legend}
        />
      </div>
    </div>
  );
}
