import { useState } from 'react';
import { DIMENSION_FIELDS, MEASURE_FIELDS } from './fields';
import type { Field, FieldType } from './types';
import { ChevronDown, ChevronRight, GripVertical, Search, Layers } from 'lucide-react';

interface FieldPanelProps {
  onDragStart?: (field: Field) => void;
  onDragEnd?: () => void;
}

export default function FieldPanel({ onDragStart, onDragEnd }: FieldPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<FieldType, boolean>>({
    dimension: true,
    measure: true,
  });
  const [draggingField, setDraggingField] = useState<Field | null>(null);

  const toggleSection = (type: FieldType) => {
    setExpandedSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleDragStart = (e: React.DragEvent, field: Field) => {
    e.dataTransfer.setData('application/json', JSON.stringify(field));
    e.dataTransfer.setData('text/plain', field.name);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingField(field);
    onDragStart?.(field);

    // 创建自定义拖拽图像
    const dragImage = document.createElement('div');
    dragImage.className = 'fixed -left-9999 pointer-events-none';
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      padding: 8px 12px;
      background: white;
      border: 1px solid #10b981;
      border-radius: 8px;
      font-size: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      color: #374151;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    const dot = document.createElement('span');
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background: ${field.type === 'dimension' ? '#3b82f6' : '#f59e0b'};
    `;
    dragImage.appendChild(dot);
    const text = document.createElement('span');
    text.textContent = field.name;
    dragImage.appendChild(text);
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 10, 10);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggingField(null);
    onDragEnd?.();
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

  const FieldItem = ({ field }: { field: Field }) => {
    const isDragging = draggingField?.id === field.id;
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, field)}
        onDragEnd={handleDragEnd}
        className={`flex items-center gap-2 px-3 py-2.5 mx-2 mb-1.5 rounded-lg bg-white border cursor-grab hover:shadow-sm transition-all group active:cursor-grabbing select-none
          ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
          ${isDragging ? 'border-emerald-400' : 'border-gray-200 hover:border-emerald-300'}
          ${isDragging ? 'bg-emerald-50' : 'hover:bg-emerald-50'}
        `}
      >
        <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-emerald-400 flex-shrink-0" />
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            field.type === 'dimension' ? 'bg-blue-500' : 'bg-amber-500'
          }`}
        />
        <span
          className="text-sm text-gray-700 flex-1 truncate font-medium"
          title={field.description}
        >
          {field.name}
        </span>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
          {field.type === 'dimension' ? '维度' : '指标'}
        </span>
      </div>
    );
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          数据字段
        </h3>
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

      <div className="flex-1 overflow-y-auto py-3">
        <div>
          <button
            onClick={() => toggleSection('dimension')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expandedSections.dimension ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            维度字段
            <span className="ml-auto text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              {filteredDimensions.length}
            </span>
          </button>
          {expandedSections.dimension && (
            <div className="mt-1.5 space-y-0.5">
              {filteredDimensions.map((field) => (
                <FieldItem key={field.id} field={field} />
              ))}
              {filteredDimensions.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">无匹配字段</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-3">
          <button
            onClick={() => toggleSection('measure')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {expandedSections.measure ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            指标字段
            <span className="ml-auto text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              {filteredMeasures.length}
            </span>
          </button>
          {expandedSections.measure && (
            <div className="mt-1.5 space-y-0.5">
              {filteredMeasures.map((field) => (
                <FieldItem key={field.id} field={field} />
              ))}
              {filteredMeasures.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">无匹配字段</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            维度 - 分类属性
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            指标 - 数值统计
          </div>
        </div>
      </div>
    </div>
  );
}
