import { useState } from 'react';
import type { ConfigField, Field, FilterCondition, AggregationType } from './types';
import { AGGREGATION_LABELS } from './types';
import { X, GripVertical, Settings, Trash2 } from 'lucide-react';
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
}
function ConfigSlot({ title, description, fields, onDrop, onRemove, onAggregationChange, acceptType = 'both', maxItems, icon, color, }: ConfigSlotProps) {
 const [isDragOver, setIsDragOver] = useState(false);
 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 if (maxItems && fields.length >= maxItems)
 return;
 setIsDragOver(true);
 };
 const handleDragLeave = () => {
 setIsDragOver(false);
 };
 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragOver(false);
 if (maxItems && fields.length >= maxItems)
 return;
 try {
 const fieldData = JSON.parse(e.dataTransfer.getData('field')) as Field;
 if (acceptType !== 'both' && fieldData.type !== acceptType) {
 return;
 }
 onDrop(fieldData);
 }
 catch {
 // ignore
 }
 };
 const bgColor = color || 'bg-gray-50';
 const borderColor = isDragOver ? 'border-emerald-400 border-2' : 'border-dashed border-gray-300';
 return (<div className="bg-white rounded-lg border border-gray-200 p-3">
 <div className="flex items-center gap-2 mb-2">
 {icon}
 <h4 className="text-sm font-medium text-gray-700">{title}</h4>
 <span className="text-xs text-gray-400">
 {fields.length}{maxItems ? `/${maxItems}` : ''}
 </span>
 </div>
 <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`min-h-12 rounded-lg border transition-all ${bgColor} ${borderColor} ${isDragOver ? 'bg-emerald-50' : ''} p-2`}>
 {fields.length === 0 ? (<p className="text-xs text-gray-400 text-center py-2">
 {description || '拖拽字段到此处'}
 </p>) : (<div className="space-y-1">
 {fields.map((field, index) => (<div key={`${field.id}-${index}`} className="flex items-center gap-2 px-2 py-1.5 bg-white rounded border border-gray-200 group hover:border-emerald-300">
 <GripVertical className="w-3 h-3 text-gray-300"/>
 <span className={`w-1.5 h-1.5 rounded-full ${field.type === 'dimension' ? 'bg-blue-500' : 'bg-amber-500'}`}/>
 <span className="text-sm text-gray-700 flex-1 truncate">{field.name}</span>
 {field.type === 'measure' && onAggregationChange && (<select value={field.aggregation || 'sum'} onChange={(e) => onAggregationChange(index, e.target.value as AggregationType)} className="text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500">
 {Object.entries(AGGREGATION_LABELS).map(([value, label]) => (<option key={value} value={value}>
 {label}
 </option>))}
 </select>)}
 <button onClick={() => onRemove(index)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity">
 <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/>
 </button>
 </div>))}
 </div>)}
 </div>
 </div>);
}
interface ConfigPanelProps {
 xAxis: ConfigField[];
 yAxis: ConfigField[];
 legend: ConfigField[];
 filters: FilterCondition[];
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
export default function ConfigPanel({ xAxis, yAxis, legend, filters, onXAxisDrop, onYAxisDrop, onLegendDrop, onFilterDrop, onXAxisRemove, onYAxisRemove, onLegendRemove, onFilterRemove, onYAxisAggregationChange, onFilterValueChange, }: ConfigPanelProps) {
 const [showFilters, setShowFilters] = useState(true);
 return (<div className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
 <div className="p-4 border-b border-gray-200">
 <h3 className="font-semibold text-gray-900 flex items-center gap-2">
 <Settings className="w-4 h-4"/>
 图表配置
 </h3>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 <ConfigSlot title="X 轴" description="拖入维度字段" fields={xAxis} onDrop={onXAxisDrop} onRemove={onXAxisRemove} acceptType="dimension" maxItems={2} icon={<span className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold">X</span>} color="bg-blue-50/30"/>

 <ConfigSlot title="Y 轴" description="拖入指标字段" fields={yAxis} onDrop={onYAxisDrop} onRemove={onYAxisRemove} onAggregationChange={onYAxisAggregationChange} acceptType="measure" maxItems={5} icon={<span className="w-5 h-5 bg-amber-100 text-amber-600 rounded flex items-center justify-center text-xs font-bold">Y</span>} color="bg-amber-50/30"/>

 <ConfigSlot title="图例" description="拖入维度字段分组" fields={legend} onDrop={onLegendDrop} onRemove={onLegendRemove} acceptType="dimension" maxItems={1} icon={<span className="w-5 h-5 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs">◼</span>} color="bg-purple-50/30"/>

 <div>
 <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
 <Trash2 className="w-4 h-4 text-gray-400"/>
 筛选器
 <span className="ml-auto text-gray-400 text-xs">{filters.length} 个</span>
 </button>
 {showFilters && (<div className="mt-2 bg-white rounded-lg border border-gray-200 p-3">
 {filters.length === 0 ? (<p className="text-xs text-gray-400 text-center py-4">
 拖拽维度字段到此处添加筛选
 </p>) : (<div className="space-y-2">
 {filters.map((filter, index) => (<div key={index} className="flex items-center gap-2 text-sm">
 <span className="text-gray-600 truncate flex-1">
 筛选 {index + 1}
 </span>
 <input type="text" onChange={(e) => onFilterValueChange(index, e.target.value)} placeholder="输入筛选值" className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
 <button onClick={() => onFilterRemove(index)} className="p-0.5 hover:bg-red-100 rounded">
 <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/>
 </button>
 </div>))}
 </div>)}
 </div>)}
 </div>
 </div>

 <div className="p-3 border-t border-gray-200 bg-white">
 <p className="text-xs text-gray-500 text-center">
 拖拽字段到对应区域配置图表
 </p>
 </div>
 </div>);
}
