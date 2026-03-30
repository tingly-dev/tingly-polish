/**
 * Shared constants for the application
 */

// Language native name mapping (display in their own language)
export const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  'English': 'English',
  'Chinese': '中文',
  'Japanese': '日本語',
  'Korean': '한국어',
  'Spanish': 'Español',
  'French': 'Français',
  'German': 'Deutsch',
  'Italian': 'Italiano',
  'Portuguese': 'Português',
  'Russian': 'Русский',
  'Arabic': 'العربية',
};

// Short language names for compact UI (floating buttons, etc.)
export const LANGUAGE_SHORT_NAMES: Record<string, string> = {
  'English': 'En',
  'Chinese': '中',
  'Japanese': '日',
  'Korean': '한',
  'Spanish': 'Es',
  'French': 'Fr',
  'German': 'De',
  'Italian': 'It',
  'Portuguese': 'Pt',
  'Russian': 'Ru',
  'Arabic': 'Ar',
};

// Available languages list
export const AVAILABLE_LANGUAGES = Object.keys(LANGUAGE_NATIVE_NAMES) as const;
