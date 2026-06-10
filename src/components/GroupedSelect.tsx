import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Lock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GroupedSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface GroupedSelectGroup {
  label: string;
  icon?: string;
  options: GroupedSelectOption[];
}

interface GroupedSelectProps {
  groups: GroupedSelectGroup[];
  value: string;
  onChange: (value: string) => void;
  onDisabledClick?: (option: GroupedSelectOption) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function GroupedSelect({
  groups,
  value,
  onChange,
  onDisabledClick,
  placeholder = '请选择',
  className,
  required,
}: GroupedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allOptions = groups.flatMap((g) => g.options);
  const selectedOption = allOptions.find((o) => o.value === value);

  const handleOptionMouseDown = (e: React.MouseEvent, option: GroupedSelectOption) => {
    longPressTriggeredRef.current = false;
    if (option.disabled) {
      pressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
      }, 500);
    }
  };

  const handleOptionMouseUp = (option: GroupedSelectOption) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleOptionClick = (e: React.MouseEvent, option: GroupedSelectOption) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (option.disabled) {
      if (!longPressTriggeredRef.current) {
        onDisabledClick?.(option);
      }
      return;
    }

    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3 py-2 text-left border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
          'bg-white flex items-center justify-between gap-2 transition-colors',
          'hover:border-gray-400'
        )}
      >
        <span className={cn('text-sm truncate', !selectedOption && 'text-gray-500')}>
          {selectedOption?.label || placeholder}
          {required && !selectedOption && <span className="text-red-500 ml-1">*</span>}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {groups.map((group, groupIndex) => {
            const availableOptions = group.options.filter((o) => !o.disabled);
            if (group.options.length === 0) return null;

            return (
              <div key={groupIndex} className={groupIndex > 0 ? 'border-t border-gray-100' : ''}>
                <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 flex items-center gap-1.5 sticky top-0">
                  {group.icon && <span>{group.icon}</span>}
                  <span>{group.label}</span>
                  {availableOptions.length === 0 && group.options.length > 0 && (
                    <Lock className="w-3 h-3 ml-auto text-gray-400" />
                  )}
                </div>
                {group.options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <div
                      key={option.value}
                      onMouseDown={(e) => handleOptionMouseDown(e, option)}
                      onMouseUp={() => handleOptionMouseUp(option)}
                      onMouseLeave={() => {
                        if (pressTimerRef.current) {
                          clearTimeout(pressTimerRef.current);
                          pressTimerRef.current = null;
                        }
                      }}
                      onClick={(e) => handleOptionClick(e, option)}
                      className={cn(
                        'px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors',
                        isSelected && !option.disabled && 'bg-emerald-50',
                        option.disabled
                          ? 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-70'
                          : 'hover:bg-gray-50 text-gray-900'
                      )}
                      title={option.disabled ? option.disabledReason : undefined}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {option.disabled && <Lock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />}
                        <span className={cn('truncate', option.disabled && 'line-through opacity-60')}>
                          {option.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {option.disabled && option.disabledReason && (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                        )}
                        {isSelected && !option.disabled && (
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
