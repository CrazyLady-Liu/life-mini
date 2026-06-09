import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  ComposedChart,
  Area,
} from 'recharts';
import type {
  ChartDataPoint,
  SankeyData,
  HeatmapCell,
  FunnelItem,
  ChartType,
  ConfigField,
} from './types';
import { formatCurrency } from '@/utils/format';

interface ChartRendererProps {
  chartType: ChartType;
  data: ChartDataPoint[];
  sankeyData?: SankeyData;
  heatmapData?: HeatmapCell[];
  funnelData?: FunnelItem[];
  scatterData?: ChartDataPoint[];
  xFields: ConfigField[];
  yFields: ConfigField[];
  legendFields: ConfigField[];
  height?: number;
}

const COLORS = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

const getBarDataKeys = (
  data: ChartDataPoint[],
  yFields: ConfigField[],
  hasLegend: boolean
): string[] => {
  if (data.length === 0) return yFields.map((f) => f.name);
  const firstItem = data[0];
  return Object.keys(firstItem).filter((key) => key !== 'name');
};

function BarChartRenderer({
  data,
  yFields,
  legendFields,
  stacked = false,
}: {
  data: ChartDataPoint[];
  yFields: ConfigField[];
  legendFields: ConfigField[];
  stacked?: boolean;
}) {
  const dataKeys = useMemo(
    () => getBarDataKeys(data, yFields, legendFields.length > 0),
    [data, yFields, legendFields]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        {legendFields.length > 0 && <Legend />}
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={COLORS[index % COLORS.length]}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartRenderer({
  data,
  yFields,
  legendFields,
}: {
  data: ChartDataPoint[];
  yFields: ConfigField[];
  legendFields: ConfigField[];
}) {
  const dataKeys = useMemo(
    () => getBarDataKeys(data, yFields, legendFields.length > 0),
    [data, yFields, legendFields]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        {legendFields.length > 0 && <Legend />}
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function DualAxisChartRenderer({
  data,
  yFields,
}: {
  data: ChartDataPoint[];
  yFields: ConfigField[];
}) {
  const dataKeys = useMemo(
    () => getBarDataKeys(data, yFields, false),
    [data, yFields]
  );

  if (dataKeys.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        双轴图需要至少2个指标字段
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey={dataKeys[0]}
          fill={COLORS[0]}
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={dataKeys[1]}
          stroke={COLORS[1]}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ScatterChartRenderer({
  data,
  xField,
  yField,
}: {
  data: ChartDataPoint[];
  xField?: ConfigField;
  yField?: ConfigField;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          type="number"
          dataKey="x"
          name={xField?.name || 'X轴'}
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
          label={{
            value: xField?.name || 'X轴',
            position: 'bottom',
            offset: 0,
            style: { fontSize: 12, fill: '#6b7280' },
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yField?.name || 'Y轴'}
          tick={{ fontSize: 12 }}
          stroke="#9ca3af"
          label={{
            value: yField?.name || 'Y轴',
            angle: -90,
            position: 'left',
            style: { fontSize: 12, fill: '#6b7280' },
          }}
        />
        <ZAxis type="number" dataKey="value" range={[4, 20]} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend />
        <Scatter name="数据点" data={data} fill="#10b981">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function HeatmapRenderer({ data }: { data: HeatmapCell[] }) {
  const xCategories = useMemo(() => {
    const set = new Set(data.map((d) => d.x));
    return Array.from(set).sort();
  }, [data]);

  const yCategories = useMemo(() => {
    const set = new Set(data.map((d) => d.y));
    return Array.from(set).sort();
  }, [data]);

  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  const getColor = (value: number) => {
    const ratio = value / maxValue;
    if (ratio < 0.25) return '#d1fae5';
    if (ratio < 0.5) return '#6ee7b7';
    if (ratio < 0.75) return '#34d399';
    return '#10b981';
  };

  const cellWidth = 100 / (xCategories.length || 1);
  const cellHeight = 100 / (yCategories.length || 1);

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex-1 flex">
        <div className="flex flex-col justify-around pr-2" style={{ width: '80px' }}>
          {yCategories.map((y) => (
            <div key={y} className="text-xs text-gray-600 text-right truncate" title={y}>
              {y}
            </div>
          ))}
        </div>
        <div className="flex-1 relative">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {data.map((cell, index) => {
              const xIndex = xCategories.indexOf(cell.x);
              const yIndex = yCategories.indexOf(cell.y);
              return (
                <g key={index}>
                  <rect
                    x={xIndex * cellWidth}
                    y={yIndex * cellHeight}
                    width={cellWidth}
                    height={cellHeight}
                    fill={getColor(cell.value)}
                    stroke="#fff"
                    strokeWidth="0.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                  <text
                    x={xIndex * cellWidth + cellWidth / 2}
                    y={yIndex * cellHeight + cellHeight / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2"
                    fill={cell.value / maxValue > 0.5 ? '#fff' : '#374151'}
                  >
                    {cell.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="flex justify-around mt-2" style={{ marginLeft: '80px' }}>
        {xCategories.map((x) => (
          <div key={x} className="text-xs text-gray-600 truncate flex-1 text-center" title={x}>
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelChartRenderer({ data }: { data: FunnelItem[] }) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: number) => [value, '数值']}
        />
        <Funnel
          dataKey="value"
          isAnimationActive
          data={chartData}
        >
          <LabelList position="right" fill="#374151" stroke="none" dataKey="name" fontSize={12} />
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

function SankeyChartRenderer({ data }: { data: SankeyData }) {
  const { nodes, links } = data;

  const nodeWidth = 20;
  const nodePadding = 20;
  const chartWidth = 700;
  const chartHeight = 400;
  const marginLeft = 120;
  const marginRight = 120;

  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; height: number }>();
    const categories = [...new Set(nodes.map((n) => n.category || 'default'))];
    const cols = categories.length;
    const colWidth = (chartWidth - marginLeft - marginRight - nodeWidth) / (cols - 1 || 1);

    categories.forEach((cat, colIndex) => {
      const catNodes = nodes.filter((n) => (n.category || 'default') === cat);
      const totalHeight = chartHeight - nodePadding * (catNodes.length - 1);
      const nodeHeight = totalHeight / catNodes.length;

      catNodes.forEach((node, nodeIndex) => {
        const x = marginLeft + colIndex * colWidth;
        const y = nodeIndex * (nodeHeight + nodePadding);
        map.set(node.name, { x, y, height: nodeHeight });
      });
    });

    return map;
  }, [nodes]);

  const maxLinkValue = Math.max(...links.map((l) => l.value), 1);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full max-w-3xl">
        <defs>
          {links.map((link, index) => {
            const sourceNode = nodes[link.source];
            const targetNode = nodes[link.target];
            const sourcePos = nodeMap.get(sourceNode.name) || { x: 0, y: 0, height: 0 };
            const targetPos = nodeMap.get(targetNode.name) || { x: 0, y: 0, height: 0 };
            return (
              <linearGradient
                key={`gradient-${index}`}
                id={`sankey-gradient-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity="0.5" />
                <stop offset="100%" stopColor={COLORS[(index + 3) % COLORS.length]} stopOpacity="0.5" />
              </linearGradient>
            );
          })}
        </defs>

        {links.map((link, index) => {
          const sourceNode = nodes[link.source];
          const targetNode = nodes[link.target];
          const sourcePos = nodeMap.get(sourceNode.name) || { x: 0, y: 0, height: 0 };
          const targetPos = nodeMap.get(targetNode.name) || { x: 0, y: 0, height: 0 };
          const linkWidth = (link.value / maxLinkValue) * 20 + 2;

          const x1 = sourcePos.x + nodeWidth;
          const y1 = sourcePos.y + sourcePos.height / 2;
          const x2 = targetPos.x;
          const y2 = targetPos.y + targetPos.height / 2;

          const cx1 = x1 + (x2 - x1) * 0.4;
          const cx2 = x1 + (x2 - x1) * 0.6;

          return (
            <path
              key={`link-${index}`}
              d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={`url(#sankey-gradient-${index})`}
              strokeWidth={linkWidth}
              strokeLinecap="round"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <title>{`${sourceNode.name} → ${targetNode.name}: ${link.value}`}</title>
            </path>
          );
        })}

        {nodes.map((node, index) => {
          const pos = nodeMap.get(node.name) || { x: 0, y: 0, height: 0 };
          const col = [...new Set(nodes.map((n) => n.category || 'default'))].indexOf(
            node.category || 'default'
          );
          const isLeft = col === 0;
          const isRight = col === [...new Set(nodes.map((n) => n.category || 'default'))].length - 1;

          return (
            <g key={`node-${index}`}>
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeWidth}
                height={pos.height}
                fill={COLORS[index % COLORS.length]}
                rx={3}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <text
                x={isLeft ? pos.x - 8 : isRight ? pos.x + nodeWidth + 8 : pos.x + nodeWidth / 2}
                y={pos.y + pos.height / 2}
                textAnchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
                dominantBaseline="middle"
                fontSize="12"
                fill="#374151"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ChartRenderer({
  chartType,
  data,
  sankeyData,
  heatmapData,
  funnelData,
  scatterData,
  xFields,
  yFields,
  legendFields,
}: ChartRendererProps) {
  const isEmpty =
    (chartType !== 'sankey' && chartType !== 'heatmap' && chartType !== 'funnel' && chartType !== 'scatter' && data.length === 0) ||
    (chartType === 'sankey' && (!sankeyData || sankeyData.nodes.length === 0)) ||
    (chartType === 'heatmap' && (!heatmapData || heatmapData.length === 0)) ||
    (chartType === 'funnel' && (!funnelData || funnelData.length === 0)) ||
    (chartType === 'scatter' && (!scatterData || scatterData.length === 0));

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm">选择分析场景或配置维度指标生成图表</p>
      </div>
    );
  }

  switch (chartType) {
    case 'bar':
      return <BarChartRenderer data={data} yFields={yFields} legendFields={legendFields} />;
    case 'stackedBar':
      return (
        <BarChartRenderer data={data} yFields={yFields} legendFields={legendFields} stacked />
      );
    case 'line':
      return <LineChartRenderer data={data} yFields={yFields} legendFields={legendFields} />;
    case 'dualAxis':
      return <DualAxisChartRenderer data={data} yFields={yFields} />;
    case 'scatter':
      return (
        <ScatterChartRenderer
          data={scatterData || []}
          xField={xFields[0]}
          yField={yFields[0]}
        />
      );
    case 'heatmap':
      return <HeatmapRenderer data={heatmapData || []} />;
    case 'funnel':
      return <FunnelChartRenderer data={funnelData || []} />;
    case 'sankey':
      return <SankeyChartRenderer data={sankeyData || { nodes: [], links: [] }} />;
    default:
      return <BarChartRenderer data={data} yFields={yFields} legendFields={legendFields} />;
  }
}
