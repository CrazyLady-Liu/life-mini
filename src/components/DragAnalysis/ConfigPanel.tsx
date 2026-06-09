import { useState, useMemo } from 'react';
import type { ConfigField, Field, FilterCondition, AggregationType } from './types';
import { AGGREGATION_LABELS } from './types';
import { X, GripVertical, Settings, Filter, Plus } from 'lucide-react';

interface ConfigSlotProps {
  title: string;
  description?: string;
  fields: ConfigField[];
  onDrop: (field: Field) => void;
  onRemove: (index: number) => void;
  onAggregationChange?: (index: number, aggregation: AggregationType) => void;
  acceptType?: 'dimension' | 'measure' | 'both';
  maxItems?: number;
  icon?: React.ReactNode;
  color?: string;
  slotKey: string;
}

function ConfigSlot({
  title,
  description,
  fields,
  onDrop,
  onRemove,
  onAggregationChange,
  acceptType = 'both',
  maxItems,
  icon,
  color,
  slotKey,
}: ConfigSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const canAccept = (fieldType: string) => {
    if (maxItems && fields.length >= maxItems) return false;
    if (acceptType !== 'both' && fieldType !== acceptType) return false;
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (maxItems && fields.length >= maxItems) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (
      x < rect.left || x > rect.right || y < rect.top || y > rect.bottom
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const fieldData = JSON.parse(e.dataTransfer.getData('application/json')) as Field;
      if (!canAccept(fieldData.type)) {
        return;
      }
      onDrop(fieldData);
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const bgColor = color || 'bg-gray-50';
  const borderColor = isDragOver
    ? 'border-emerald-500 border-2 bg-emerald-50'
    : 'border-dashed border-gray-300';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <span className="text-xs text-gray-400">
          {fields.length}
          {maxItems ? `/${maxItems}` : ''}
        </span>
      </div>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-slot={slotKey}
        className={`min-h-12 rounded-lg border transition-all duration-200 ${bgColor} ${borderColor} p-2`}
      >
        {fields.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2 flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            {description || '拖拽字段到此处'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {fields.map((field, index) => (
            <div
              key={`${field.id}-${index}`}
              className="flex items-center gap-2 px-2.5 py-2 bg-white rounded-lg border border-gray-200 group hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <GripVertical className="w-3.5 h-3.5 text-gray-300" />
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  field.type === 'dimension' ? 'bg-blue-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-sm text-gray-700 flex-1 truncate font-medium">
                {field.name}
              </span>
              {field.type === 'measure' && onAggregationChange && (
                <select
                  value={field.aggregation || 'sum'}
                  onChange={(e) =>
                    onAggregationChange(index, e.target.value as AggregationType)
                  }
                  className="text-xs border border-gray-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50"
                >
                  {Object.entries(AGGREGATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => onRemove(index)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-md transition-all"
                title="移除"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterSlotProps {
  filters: FilterCondition[];
  onDrop: (field: Field) => void;
  onRemove: (index: number) => void;
  onValueChange: (index: number, value: string) => void;
  fieldNames: Map<string, string>;
}

function FilterSlot({ filters, onDrop, onRemove, onValueChange, fieldNames }: FilterSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (
      x < rect.left || x > rect.right || y < rect.top || y > rect.bottom
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const fieldData = JSON.parse(e.dataTransfer.getData('application/json')) as Field;
      if (fieldData.type === 'dimension') {
        onDrop(fieldData);
      }
    } catch (err) {
      console.error('Filter drop error:', err);
    }
  };

  const borderColor = isDragOver
    ? 'border-emerald-500 border-2 bg-emerald-50'
    : 'border-dashed border-gray-300';

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-slot="filter"
      className={`rounded-lg border transition-all duration-200 bg-gray-50 p-3 ${borderColor}`}
    >
      {filters.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3 flex items-center justify-center gap-1">
          <Plus className="w-3.5 h-3.5" />
          拖拽维度字段到此处添加筛选
        </p>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm bg-white p-2 rounded-md border border-gray-200"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-700 text-xs font-medium truncate max-w-16">
                {fieldNames.get(filter.fieldId) || filter.fieldId}
              </span>
              <span className="text-gray-400 text-xs">等于</span>
              <input
                type="text"
                value={(filter.value as string) || ''}
                onChange={(e) => onValueChange(index, e.target.value)}
                placeholder="输入值"
                className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => onRemove(index)}
                className="p-0.5 hover:bg-red-100 rounded-md flex-shrink-0"
                title="移除筛选"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ConfigPanelProps {
  xAxis: ConfigField[];
  yAxis: ConfigField[];
  legend: ConfigField[];
  filters: FilterCondition[];
  xAxisAcceptType?: 'dimension' | 'measure' | 'both';
  filterFieldNames?: Map<string, string>;
  onXAxisDrop: (field: Field) => void;
  onYAxisDrop: (field: Field) => void;
  onLegendDrop: (field: Field) => void;
  onFilterDrop: (field: Field) => void;
  onXAxisRemove: (index: number) => void;
  onYAxisRemove: (index: number) => void;
  onLegendRemove: (index: number) => void;
  onFilterRemove: (index: number) => void;
  onYAxisAggregationChange: (index: number, aggregation: AggregationType) => void;
  onFilterValueChange: (index: number, value: string) => void;
}

export default function ConfigPanel({
  xAxis,
  yAxis,
  legend,
  filters,
  xAxisAcceptType = 'dimension',
  filterFieldNames,
  onXAxisDrop,
  onYAxisDrop,
  onLegendDrop,
  onFilterDrop,
  onXAxisRemove,
  onYAxisRemove,
  onLegendRemove,
  onFilterRemove,
  onYAxisAggregationChange,
  onFilterValueChange,
}: ConfigPanelProps) {
  const [showFilters, setShowFilters] = useState(true);

  const fieldNames = useMemo(() => {
    const map = new Map<string, string>();
    xAxis.forEach((f) => map.set(f.id, f.name));
    yAxis.forEach((f) => map.set(f.id, f.name));
    legend.forEach((f) => map.set(f.id, f.name));
    if (filterFieldNames) {
      filterFieldNames.forEach((name, id) => map.set(id, name));
    }
    return map;
  }, [xAxis, yAxis, legend, filterFieldNames]);

  return (
    <div className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-500" />
          图表配置
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ConfigSlot
          title="X 轴"
          description={xAxisAcceptType === 'measure' ? '拖入指标字段' : '拖入维度字段'}
          fields={xAxis}
          onDrop={onXAxisDrop}
          onRemove={onXAxisRemove}
          acceptType={xAxisAcceptType}
          maxItems={5}
          slotKey="xAxis"
          icon={
            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
              xAxisAcceptType === 'measure' 
                ? 'bg-amber-100 text-amber-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              X
            </span>
          }
          color={xAxisAcceptType === 'measure' ? 'bg-amber-50/50' : 'bg-blue-50/50'}
        />

        <ConfigSlot
          title="Y 轴"
          description="拖入指标字段"
          fields={yAxis}
          onDrop={onYAxisDrop}
          onRemove={onYAxisRemove}
          onAggregationChange={onYAxisAggregationChange}
          acceptType="measure"
          maxItems={5}
          slotKey="yAxis"
          icon={
            <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-md flex items-center justify-center text-xs font-bold">
              Y
            </span>
          }
          color="bg-amber-50/50"
        />

        <ConfigSlot
          title="图例"
          description="拖入维度字段分组"
          fields={legend}
          onDrop={onLegendDrop}
          onRemove={onLegendRemove}
          acceptType="dimension"
          maxItems={1}
          slotKey="legend"
          icon={
            <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center text-xs">
              ◼
            </span>
          }
          color="bg-purple-50/50"
        />

        <div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-400" />
            筛选器
            <span className="ml-auto text-gray-400 text-xs">{filters.length} 个</span>
          </button>
          {showFilters && (
            <div className="mt-2">
              <FilterSlot
                filters={filters}
                onDrop={onFilterDrop}
                onRemove={onFilterRemove}
                onValueChange={onFilterValueChange}
                fieldNames={fieldNames}
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500 text-center">
          💡 拖拽左侧字段到对应区域
        </p>
      </div>
    </div>
  );
}
