import { useMemo } from 'react';
import type { NameValidationConfig } from '@/config/nameInputConfig';
import { DEFAULT_NAME_VALIDATION_CONFIG } from '@/config/nameInputConfig';

export type ValidationStatus = 'idle' | 'success' | 'error' | 'warning';

interface ValidationResult {
  valid: boolean;
  status: ValidationStatus;
  message: string;
  errors: string[];
}

interface UseNameValidationOptions {
  name: string;
  config?: Partial<NameValidationConfig>;
  enabled?: boolean;
}

interface UseNameValidationReturn extends ValidationResult {
  validate: () => ValidationResult;
}

function formatMessage(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] || ''));
}

export function useNameValidation({
  name,
  config: customConfig,
  enabled = true,
}: UseNameValidationOptions): UseNameValidationReturn {
  const config = useMemo<NameValidationConfig>(
    () => ({ ...DEFAULT_NAME_VALIDATION_CONFIG, ...customConfig }),
    [customConfig]
  );

  const validate = useMemo(() => {
    return (): ValidationResult => {
      if (!enabled || !name) {
        return { valid: true, status: 'idle', message: '', errors: [] };
      }

      const errors: string[] = [];

      if (name.length < config.minLength) {
        errors.push(
          formatMessage(config.messages.tooShort, { minLength: config.minLength })
        );
      }

      if (name.length > config.maxLength) {
        errors.push(
          formatMessage(config.messages.tooLong, { maxLength: config.maxLength })
        );
      }

      if (!config.pattern.test(name)) {
        errors.push(config.messages.invalidPattern);
      }

      if (errors.length > 0) {
        return {
          valid: false,
          status: 'error',
          message: errors[0],
          errors,
        };
      }

      return {
        valid: true,
        status: 'success',
        message: config.messages.valid,
        errors: [],
      };
    };
  }, [name, config, enabled]);

  const result = useMemo(() => validate(), [validate]);

  return {
    ...result,
    validate,
  };
}
