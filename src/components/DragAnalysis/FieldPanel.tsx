import { useState } from 'react';
import { DIMENSION_FIELDS, MEASURE_FIELDS } from './fields';
import type { Field, FieldType } from './types';
import { ChevronDown, ChevronRight, GripVertical, Search } from 'lucide-react';

interface FieldPanelProps {
  onDragStart: (field: Field) => void;
}

export default function FieldPanel({ onDragStart }: FieldPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<FieldType, boolean>>({
    dimension: true,
    measure: true,
  });

  const toggleSection = (type: FieldType) => {
    setExpandedSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleDragStart = (e: React.DragEvent, field: Field) => {
    e.dataTransfer.setData('field', JSON.stringify(field));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(field);
  };

  const filteredDimensions = DIMENSION_FIELDS.filter(
    (f) =>
      f.name.toLowerCase().includes(searchText.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredMeasures = MEASURE_FIELDS.filter(
    (f) =>
      f.name.toLowerCase().includes(searchText.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const FieldItem = ({ field }: { field: Field }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, field)}
      className="flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded-lg bg-white border border-gray-200 cursor-grab hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm transition-all group active:cursor-grabbing"
    >
      <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-emerald-400" />
      <div
        className={`w-2 h-2 rounded-full ${field.type === 'dimension' ? 'bg-blue-500' : 'bg-amber-500'}`}
      />
      <span className="text-sm text-gray-700 flex-1 truncate" title={field.description}>
        {field.name}
      </span>
    </div>
  );

  return (
    <div className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">数据字段</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索字段..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div>
          <button
            onClick={() => toggleSection('dimension')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expandedSections.dimension ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            维度
            <span className="ml-auto text-gray-400 text-xs">{filteredDimensions.length}</span>
          </button>
          {expandedSections.dimension && (
            <div className="mt-1 space-y-1">
              {filteredDimensions.map((field) => (
                <FieldItem key={field.id} field={field} />
              ))}
              {filteredDimensions.length === 0 && (
                <p className="px-4 py-2 text-sm text-gray-400">无匹配字段</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-2">
          <button
            onClick={() => toggleSection('measure')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expandedSections.measure ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            指标
            <span className="ml-auto text-gray-400 text-xs">{filteredMeasures.length}</span>
          </button>
          {expandedSections.measure && (
            <div className="mt-1 space-y-1">
              {filteredMeasures.map((field) => (
                <FieldItem key={field.id} field={field} />
              ))}
              {filteredMeasures.length === 0 && (
                <p className="px-4 py-2 text-sm text-gray-400">无匹配字段</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500 text-center">
          拖拽字段到右侧配置区
        </p>
      </div>
    </div>
  );
}
