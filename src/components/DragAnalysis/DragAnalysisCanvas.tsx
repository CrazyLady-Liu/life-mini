import { useState, useMemo } from 'react';
import FieldPanel from './FieldPanel';
import ConfigPanel from './ConfigPanel';
import ChartRenderer from './ChartRenderer';
import type {
  Field,
  ConfigField,
  AnalysisConfig,
  ChartType,
  FilterCondition,
  AggregationType,
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
import {
  BarChart3,
  TrendingUp,
  Layers,
  Activity,
  CircleDot,
  Grid3X3,
  FunnelIcon,
  GitBranch,
  Sparkles,
  RefreshCcw,
  Download,
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

const SAMPLE_SCENARIOS = [
  {
    id: 'sankey-flow',
    name: '租赁流向分析',
    description: '客户类型 → 租赁套餐 → 装备分类',
    chartType: 'sankey' as ChartType,
  },
  {
    id: 'heatmap-usage',
    name: '使用频次热力图',
    description: '月份 × 装备分类',
    chartType: 'heatmap' as ChartType,
  },
  {
    id: 'scatter-roi',
    name: '性价比分析',
    description: '采购成本 VS 租赁收入',
    chartType: 'scatter' as ChartType,
  },
];

export default function DragAnalysisCanvas({ initialConfig }: DragAnalysisCanvasProps) {
  const [config, setConfig] = useState<AnalysisConfig>({
    xAxis: initialConfig?.xAxis || [],
    yAxis: initialConfig?.yAxis || [],
    legend: initialConfig?.legend || [],
    filters: initialConfig?.filters || [],
    chartType: initialConfig?.chartType || 'bar',
  });

  const joinedData = useJoinedData();

  const chartData = useMemo(() => {
    return generateChartData(joinedData, config);
  }, [joinedData, config]);

  const sankeyData = useMemo(() => {
    if (config.chartType !== 'sankey') return undefined;
    const dimFields = [...config.xAxis, ...config.legend];
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

  const handleXAxisDrop = (field: Field) => {
    setConfig((prev) => ({
      ...prev,
      xAxis: [...prev.xAxis, { ...field, aggregation: field.type === 'measure' ? 'sum' : undefined }],
    }));
  };

  const handleYAxisDrop = (field: Field) => {
    setConfig((prev) => ({
      ...prev,
      yAxis: [...prev.yAxis, { ...field, aggregation: 'sum' }],
    }));
  };

  const handleLegendDrop = (field: Field) => {
    setConfig((prev) => ({
      ...prev,
      legend: [...prev.legend, { ...field }],
    }));
  };

  const handleFilterDrop = (field: Field) => {
    setConfig((prev) => ({
      ...prev,
      filters: [...prev.filters, { fieldId: field.id, operator: 'eq', value: '' }],
    }));
  };

  const handleXAxisRemove = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      xAxis: prev.xAxis.filter((_, i) => i !== index),
    }));
  };

  const handleYAxisRemove = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      yAxis: prev.yAxis.filter((_, i) => i !== index),
    }));
  };

  const handleLegendRemove = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      legend: prev.legend.filter((_, i) => i !== index),
    }));
  };

  const handleFilterRemove = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  };

  const handleYAxisAggregationChange = (index: number, aggregation: AggregationType) => {
    setConfig((prev) => ({
      ...prev,
      yAxis: prev.yAxis.map((f, i) => (i === index ? { ...f, aggregation } : f)),
    }));
  };

  const handleFilterValueChange = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      filters: prev.filters.map((f, i) => (i === index ? { ...f, value } : f)),
    }));
  };

  const handleChartTypeChange = (chartType: ChartType) => {
    setConfig((prev) => ({ ...prev, chartType }));
  };

  const handleReset = () => {
    setConfig({
      xAxis: [],
      yAxis: [],
      legend: [],
      filters: [],
      chartType: 'bar',
    });
  };

  const loadScenario = (scenarioId: string) => {
    switch (scenarioId) {
      case 'sankey-flow':
        setConfig({
          xAxis: [
            {
              id: 'customerType',
              name: '客户类型',
              type: 'dimension',
              dataType: 'string',
              source: 'customer',
            },
            {
              id: 'packageType',
              name: '租赁套餐',
              type: 'dimension',
              dataType: 'string',
              source: 'rental',
            },
          ],
          yAxis: [
            {
              id: 'rentalCount',
              name: '租赁次数',
              type: 'measure',
              dataType: 'number',
              source: 'rental',
              aggregation: 'sum',
            },
          ],
          legend: [
            {
              id: 'category',
              name: '装备分类',
              type: 'dimension',
              dataType: 'string',
              source: 'equipment',
            },
          ],
          filters: [],
          chartType: 'sankey',
        });
        break;
      case 'heatmap-usage':
        setConfig({
          xAxis: [
            {
              id: 'month',
              name: '月份',
              type: 'dimension',
              dataType: 'date',
              source: 'rental',
            },
            {
              id: 'category',
              name: '装备分类',
              type: 'dimension',
              dataType: 'string',
              source: 'equipment',
            },
          ],
          yAxis: [
            {
              id: 'rentalCount',
              name: '租赁次数',
              type: 'measure',
              dataType: 'number',
              source: 'rental',
              aggregation: 'sum',
            },
          ],
          legend: [],
          filters: [],
          chartType: 'heatmap',
        });
        break;
      case 'scatter-roi':
        setConfig({
          xAxis: [
            {
              id: 'purchasePrice',
              name: '采购成本',
              type: 'measure',
              dataType: 'number',
              source: 'equipment',
              aggregation: 'avg',
            },
          ],
          yAxis: [
            {
              id: 'totalRevenue',
              name: '累计收入',
              type: 'measure',
              dataType: 'number',
              source: 'rental',
              aggregation: 'sum',
            },
          ],
          legend: [
            {
              id: 'category',
              name: '装备分类',
              type: 'dimension',
              dataType: 'string',
              source: 'equipment',
            },
          ],
          filters: [],
          chartType: 'scatter',
        });
        break;
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(
      {
        config,
        data: chartData,
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
  };

  const handleDragStart = () => {
    // 可以添加拖拽开始的视觉反馈
  };

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

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">自助分析画布</h3>
            <p className="text-xs text-gray-500">拖拽维度和指标自由生成图表</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto">
        <span className="text-xs text-gray-500 mr-2">图表类型:</span>
        {chartTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleChartTypeChange(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap ${
              config.chartType === type
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {CHART_TYPE_ICONS[type]}
            {CHART_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <FieldPanel onDragStart={handleDragStart} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto">
            <span className="text-xs text-gray-500">示例场景:</span>
            {SAMPLE_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => loadScenario(scenario.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-lg hover:from-emerald-100 hover:to-teal-100 transition-all whitespace-nowrap border border-emerald-100"
              >
                {CHART_TYPE_ICONS[scenario.chartType]}
                <span className="font-medium">{scenario.name}</span>
                <span className="text-emerald-500">-</span>
                <span className="text-emerald-600/80">{scenario.description}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-4">
            <div className="h-full bg-gray-50 rounded-xl border border-gray-200 border-dashed">
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
        </div>

        <ConfigPanel
          xAxis={config.xAxis}
          yAxis={config.yAxis}
          legend={config.legend}
          filters={config.filters}
          onXAxisDrop={handleXAxisDrop}
          onYAxisDrop={handleYAxisDrop}
          onLegendDrop={handleLegendDrop}
          onFilterDrop={handleFilterDrop}
          onXAxisRemove={handleXAxisRemove}
          onYAxisRemove={handleYAxisRemove}
          onLegendRemove={handleLegendRemove}
          onFilterRemove={handleFilterRemove}
          onYAxisAggregationChange={handleYAxisAggregationChange}
          onFilterValueChange={handleFilterValueChange}
        />
      </div>
    </div>
  );
}
