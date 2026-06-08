import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { NameSuggestionConfig } from '@/config/nameInputConfig';
import { DEFAULT_NAME_SUGGESTION_CONFIG } from '@/config/nameInputConfig';

interface UseNameSuggestionsOptions {
  name: string;
  categoryId: string;
  existingNames: string[];
  config?: Partial<NameSuggestionConfig>;
  excludeName?: string;
}

interface UseNameSuggestionsReturn {
  suggestions: string[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  isLoading: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  suggestionsRef: React.RefObject<HTMLDivElement>;
  handleFocus: () => void;
  handleInputChange: (value: string) => void;
  selectSuggestion: (name: string) => void;
}

export function useNameSuggestions({
  name,
  categoryId,
  existingNames,
  config: customConfig,
  excludeName,
}: UseNameSuggestionsOptions): UseNameSuggestionsReturn {
  const config = useMemo<NameSuggestionConfig>(
    () => ({ ...DEFAULT_NAME_SUGGESTION_CONFIG, ...customConfig }),
    [customConfig]
  );

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedName, setDebouncedName] = useState(name);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    if (!debouncedName || !categoryId) return [];
    if (debouncedName.length < config.minChars) return [];

    const keyword = debouncedName.toLowerCase();
    const filtered = existingNames.filter((n) => {
      if (excludeName && n === excludeName) return false;
      return n.toLowerCase().includes(keyword);
    });

    const unique = Array.from(new Set(filtered));
    return unique.slice(0, config.maxSuggestions);
  }, [debouncedName, categoryId, existingNames, excludeName, config.maxSuggestions, config.minChars]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedName(name);
      setIsLoading(false);
    }, config.debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [name, config.debounceMs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = useCallback(() => {
    if (categoryId && name.length >= config.minChars) {
      setShowSuggestions(true);
    }
  }, [categoryId, name, config.minChars]);

  const handleInputChange = useCallback((_value: string) => {
    setShowSuggestions(true);
  }, []);

  const selectSuggestion = useCallback((selectedName: string) => {
    setShowSuggestions(false);
  }, []);

  return {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    isLoading,
    containerRef,
    suggestionsRef,
    handleFocus,
    handleInputChange,
    selectSuggestion,
  };
}
