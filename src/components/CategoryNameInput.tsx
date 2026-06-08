import { useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { Search, X, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNameSuggestions } from '@/hooks/useNameSuggestions';
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck';
import { useNameValidation, type ValidationStatus } from '@/hooks/useNameValidation';
import type { CategoryNameInputConfig } from '@/config/nameInputConfig';
import { DEFAULT_CATEGORY_NAME_INPUT_CONFIG } from '@/config/nameInputConfig';

export interface CategoryNameInputProps {
  value: string;
  onChange: (value: string) => void;
  categoryId: string;
  existingNames: string[];
  config?: Partial<CategoryNameInputConfig>;
  excludeName?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  enableValidation?: boolean;
  enableDuplicateCheck?: boolean;
  enableSuggestions?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface CategoryNameInputRef {
  focus: () => void;
  validate: () => boolean;
  checkDuplicate: () => boolean;
}

const CategoryNameInput = forwardRef<CategoryNameInputRef, CategoryNameInputProps>(
  function CategoryNameInput(
    {
      value,
      onChange,
      categoryId,
      existingNames,
      config: customConfig,
      excludeName,
      placeholder = '请输入名称',
      label,
      required = false,
      disabled = false,
      className,
      enableValidation = true,
      enableDuplicateCheck = true,
      enableSuggestions = true,
      onBlur,
      onFocus,
    },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    const config = useMemo<CategoryNameInputConfig>(
      () => ({ ...DEFAULT_CATEGORY_NAME_INPUT_CONFIG, ...customConfig }),
      [customConfig]
    );

    const {
      suggestions,
      showSuggestions: showSug,
      setShowSuggestions,
      isLoading,
      containerRef,
      suggestionsRef,
      handleFocus: handleSuggestionFocus,
      handleInputChange,
      selectSuggestion,
    } = useNameSuggestions({
      name: value,
      categoryId,
      existingNames,
      config: config.suggestion,
      excludeName,
    });

    const {
      isDuplicate,
      status: duplicateStatus,
      message: duplicateMessage,
      checkNow,
      checkOnBlur,
    } = useDuplicateCheck({
      name: value,
      categoryId,
      existingNames,
      config: config.duplicateCheck,
      excludeName,
      enabled: enableDuplicateCheck,
    });

    const { valid: formatValid, status: formatStatus, message: formatMessage, validate } =
      useNameValidation({
        name: value,
        config: config.validation,
        enabled: enableValidation,
      });

    const overallStatus = useMemo<ValidationStatus>(() => {
      if (!value) return 'idle';
      if (!formatValid || isDuplicate) return 'error';
      if (suggestions.length > 0 && enableSuggestions && categoryId) return 'warning';
      if (formatStatus === 'success' && categoryId) return 'success';
      return 'idle';
    }, [formatValid, formatStatus, isDuplicate, suggestions.length, value, enableSuggestions, categoryId]);

    const overallMessage = useMemo(() => {
      if (!value) return '';
      if (!formatValid) return formatMessage;
      if (isDuplicate) return duplicateMessage;
      if (suggestions.length > 0 && enableSuggestions && categoryId) {
        return `已找到 ${suggestions.length} 个相似名称建议`;
      }
      if (formatStatus === 'success' && categoryId) {
        return formatMessage;
      }
      return '';
    }, [
      value,
      formatValid,
      formatMessage,
      isDuplicate,
      duplicateMessage,
      suggestions.length,
      formatStatus,
      enableSuggestions,
      categoryId,
    ]);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      validate: () => {
        const result = validate();
        return result.valid;
      },
      checkDuplicate: () => {
        checkNow();
        return !isDuplicate;
      },
    }));

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        handleInputChange(newValue);
      },
      [onChange, handleInputChange]
    );

    const handleClear = useCallback(() => {
      onChange('');
      setShowSuggestions(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }, [onChange, setShowSuggestions]);

    const handleFocus = useCallback(() => {
      handleSuggestionFocus();
      onFocus?.();
    }, [handleSuggestionFocus, onFocus]);

    const handleBlur = useCallback(() => {
      if (checkOnBlur) {
        checkNow();
      }
      onBlur?.();
    }, [checkOnBlur, checkNow, onBlur]);

    const handleSelectSuggestion = useCallback(
      (name: string) => {
        onChange(name);
        selectSuggestion(name);
        inputRef.current?.focus();
      },
      [onChange, selectSuggestion]
    );

    const borderClass = useMemo(() => {
      if (overallStatus === 'error') return 'border-red-400 focus:ring-red-500';
      if (overallStatus === 'success') return 'border-emerald-400';
      return 'border-gray-300';
    }, [overallStatus]);

    return (
      <div className={cn('space-y-1', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <div ref={containerRef} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
              value ? 'pr-20' : 'pr-10',
              disabled && 'bg-gray-100 cursor-not-allowed',
              borderClass
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="清除"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {overallStatus !== 'idle' && value && (
              <div className="w-5 h-5 flex items-center justify-center">
                {overallStatus === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {overallStatus === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {overallStatus === 'warning' && (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
            )}
          </div>

          {enableSuggestions && showSug && suggestions.length > 0 && !disabled && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {isLoading && (
                <div className="px-3 py-2 text-sm text-gray-500">搜索中...</div>
              )}
              {!isLoading &&
                suggestions.map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(name)}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors text-sm text-gray-700 flex items-center gap-2"
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="min-h-[20px]">
          {overallMessage && (
            <p
              className={cn(
                'text-xs flex items-center gap-1',
                overallStatus === 'error' && 'text-red-500',
                overallStatus === 'success' && 'text-emerald-600',
                overallStatus === 'warning' && 'text-amber-600'
              )}
            >
              {overallStatus === 'error' && <XCircle className="w-3 h-3 flex-shrink-0" />}
              {overallStatus === 'success' && (
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              )}
              {overallStatus === 'warning' && (
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
              )}
              {overallMessage}
            </p>
          )}
          {!categoryId && value && !overallMessage && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              请先选择分类以启用名称联想和重名校验
            </p>
          )}
        </div>
      </div>
    );
  }
);

export default CategoryNameInput;
