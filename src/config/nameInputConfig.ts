export interface NameValidationConfig {
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  patternDescription: string;
  messages: {
    empty: string;
    tooShort: string;
    tooLong: string;
    invalidPattern: string;
    valid: string;
  };
}

export interface NameSuggestionConfig {
  maxSuggestions: number;
  debounceMs: number;
  minChars: number;
}

export interface DuplicateCheckConfig {
  debounceMs: number;
  checkOnBlur: boolean;
  checkOnSubmit: boolean;
  message: string;
}

export interface CategoryNameInputConfig {
  validation: NameValidationConfig;
  suggestion: NameSuggestionConfig;
  duplicateCheck: DuplicateCheckConfig;
}

export const DEFAULT_NAME_VALIDATION_CONFIG: NameValidationConfig = {
  minLength: 2,
  maxLength: 50,
  pattern: /^[^\d\W_]/,
  patternDescription: '不以数字或特殊字符开头',
  messages: {
    empty: '',
    tooShort: '名称长度不能少于 {minLength} 个字符',
    tooLong: '名称长度不能超过 {maxLength} 个字符',
    invalidPattern: '名称不允许以数字或特殊字符开头',
    valid: '名称可用',
  },
};

export const DEFAULT_NAME_SUGGESTION_CONFIG: NameSuggestionConfig = {
  maxSuggestions: 6,
  debounceMs: 300,
  minChars: 1,
};

export const DEFAULT_DUPLICATE_CHECK_CONFIG: DuplicateCheckConfig = {
  debounceMs: 300,
  checkOnBlur: true,
  checkOnSubmit: true,
  message: '该分类下已存在同名装备，请修改名称或补充后缀',
};

export const DEFAULT_CATEGORY_NAME_INPUT_CONFIG: CategoryNameInputConfig = {
  validation: DEFAULT_NAME_VALIDATION_CONFIG,
  suggestion: DEFAULT_NAME_SUGGESTION_CONFIG,
  duplicateCheck: DEFAULT_DUPLICATE_CHECK_CONFIG,
};

export const EQUIPMENT_NAME_CONFIG: CategoryNameInputConfig = {
  ...DEFAULT_CATEGORY_NAME_INPUT_CONFIG,
  validation: {
    ...DEFAULT_NAME_VALIDATION_CONFIG,
    messages: {
      ...DEFAULT_NAME_VALIDATION_CONFIG.messages,
      valid: '装备名称可用',
    },
  },
  duplicateCheck: {
    ...DEFAULT_DUPLICATE_CHECK_CONFIG,
    message: '该分类下已存在同名装备，请修改名称或补充后缀',
  },
};
