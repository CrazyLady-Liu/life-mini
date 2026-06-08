import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { DuplicateCheckConfig } from '@/config/nameInputConfig';
import { DEFAULT_DUPLICATE_CHECK_CONFIG } from '@/config/nameInputConfig';

export type DuplicateCheckStatus = 'idle' | 'checking' | 'duplicate' | 'unique';

interface UseDuplicateCheckOptions {
  name: string;
  categoryId: string;
  existingNames: string[];
  config?: Partial<DuplicateCheckConfig>;
  excludeName?: string;
  enabled?: boolean;
}

interface UseDuplicateCheckReturn {
  isDuplicate: boolean;
  status: DuplicateCheckStatus;
  message: string;
  checkNow: () => void;
  checkOnBlur: boolean;
  checkOnSubmit: boolean;
}

export function useDuplicateCheck({
  name,
  categoryId,
  existingNames,
  config: customConfig,
  excludeName,
  enabled = true,
}: UseDuplicateCheckOptions): UseDuplicateCheckReturn {
  const config = useMemo<DuplicateCheckConfig>(
    () => ({ ...DEFAULT_DUPLICATE_CHECK_CONFIG, ...customConfig }),
    [customConfig]
  );

  const [status, setStatus] = useState<DuplicateCheckStatus>('idle');
  const [debouncedName, setDebouncedName] = useState(name);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !categoryId || !name) {
      setStatus('idle');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setStatus('checking');
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedName(name);
    }, config.debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [name, categoryId, enabled, config.debounceMs]);

  const isDuplicate = useMemo(() => {
    if (!enabled || status === 'idle' || !categoryId || !debouncedName) return false;
    return existingNames.some((n) => {
      if (excludeName && n === excludeName) return false;
      return n === debouncedName;
    });
  }, [debouncedName, categoryId, existingNames, excludeName, enabled, status]);

  useEffect(() => {
    if (!enabled || !categoryId || !debouncedName || status === 'idle') return;

    const duplicateExists = existingNames.some((n) => {
      if (excludeName && n === excludeName) return false;
      return n === debouncedName;
    });

    setStatus(duplicateExists ? 'duplicate' : 'unique');
  }, [debouncedName, categoryId, existingNames, excludeName, enabled]);

  const message = useMemo(() => {
    if (status === 'duplicate') return config.message;
    return '';
  }, [status, config.message]);

  const checkNow = useCallback(() => {
    if (!enabled || !categoryId || !name) return;
    setStatus('checking');
    const duplicateExists = existingNames.some((n) => {
      if (excludeName && n === excludeName) return false;
      return n === name;
    });
    setStatus(duplicateExists ? 'duplicate' : 'unique');
  }, [name, categoryId, existingNames, excludeName, enabled]);

  return {
    isDuplicate,
    status,
    message,
    checkNow,
    checkOnBlur: config.checkOnBlur,
    checkOnSubmit: config.checkOnSubmit,
  };
}
