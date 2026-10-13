/**
 * Subject Color Utilities for AI Tutor Timetable
 * Intelligent color management, dynamic palette generator, and theme presets.
 */

// Format hex color to rgba string
export const hexToRgba = (hex: string, alpha: number): string => {
  let c = (hex || '#3B82F6').replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) {
    return `rgba(59, 130, 246, ${alpha})`;
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Calculate perceived luminance (0 - 255)
export const getLuminance = (hex: string): number => {
  let c = (hex || '#3B82F6').replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(char => char + char).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return 128;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Lighten or darken hex color
export const adjustHexBrightness = (hex: string, percent: number): string => {
  let c = (hex || '#3B82F6').replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(char => char + char).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.min(255, Math.max(0, Math.round(r + (percent / 100) * 255)));
  g = Math.min(255, Math.max(0, Math.round(g + (percent / 100) * 255)));
  b = Math.min(255, Math.max(0, Math.round(b + (percent / 100) * 255)));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * 20 modern, curated aesthetic colors with labels
 */
export interface PaletteColor {
  hex: string;
  name: string;
  bgTailwind?: string;
}

export const CURATED_PALETTE_COLORS: PaletteColor[] = [
  { hex: '#3B82F6', name: 'Xanh Biển' },
  { hex: '#0EA5E9', name: 'Xanh Da Trời' },
  { hex: '#06B6D4', name: 'Xanh Cyan' },
  { hex: '#14B8A6', name: 'Xanh Mòng Két' },
  { hex: '#10B981', name: 'Xanh Ngọc Lục' },
  { hex: '#22C55E', name: 'Xanh Lá Tươi' },
  { hex: '#84CC16', name: 'Xanh Cốm Lime' },
  { hex: '#EAB308', name: 'Vàng Chanh' },
  { hex: '#F59E0B', name: 'Vàng Hổ Phách' },
  { hex: '#F97316', name: 'Cam Năng Động' },
  { hex: '#EF4444', name: 'Đỏ Nổi Bật' },
  { hex: '#F43F5E', name: 'Đỏ Hoa Hồng' },
  { hex: '#EC4899', name: 'Hồng Phấn' },
  { hex: '#D946EF', name: 'Hồng Fuchsia' },
  { hex: '#A855F7', name: 'Tím Oải Hương' },
  { hex: '#8B5CF6', name: 'Tím Violet' },
  { hex: '#6366F1', name: 'Tím Chàm Indigo' },
  { hex: '#4F46E5', name: 'Xanh Tím Hoàng Gia' },
  { hex: '#0284C7', name: 'Xanh Đại Dương' },
  { hex: '#64748B', name: 'Xám Thép Slate' },
];

/**
 * Smart default colors mapped specifically to Vietnamese school curriculum
 */
export const DEFAULT_SUBJECT_COLORS: Record<string, string> = {
  // Toán học
  'toán': '#3B82F6',
  't.cường toán': '#2563EB',
  'tăng cường toán': '#2563EB',
  'toán nâng cao': '#1D4ED8',
  'đại số': '#3B82F6',
  'hình học': '#60A5FA',

  // Ngữ văn & Tiếng Việt
  'tiếng việt': '#8B5CF6',
  't.cường tiếng việt': '#7C3AED',
  'tăng cường tiếng việt': '#7C3AED',
  'ngữ văn': '#9333EA',
  'văn': '#9333EA',
  'học vần': '#A855F7',
  'tập viết': '#C084FC',
  'kể chuyện': '#D946EF',
  'tập đọc': '#A855F7',
  'chính tả': '#C084FC',
  'luyện từ và câu': '#8B5CF6',
  'tập làm văn': '#9333EA',

  // Ngoại ngữ
  'tiếng anh': '#10B981',
  'ngoại ngữ': '#059669',
  'tiếng pháp': '#0D9488',
  'tiếng trung': '#047857',

  // Tự nhiên & Xã hội / Khoa học
  'tnxh': '#06B6D4',
  'tự nhiên và xã hội': '#06B6D4',
  'tự nhiên & xã hội': '#06B6D4',
  'khoa học': '#0EA5E9',
  'khoa học tự nhiên': '#0284C7',
  'khtn': '#0284C7',
  'vật lý': '#38BDF8',
  'vật lí': '#38BDF8',
  'lý': '#38BDF8',
  'hóa học': '#F97316',
  'hóa': '#F97316',
  'sinh học': '#14B8A6',
  'sinh': '#14B8A6',

  // Lịch sử & Địa lý
  'lịch sử': '#F43F5E',
  'sử': '#F43F5E',
  'địa lý': '#E11D48',
  'địa lí': '#E11D48',
  'địa': '#E11D48',
  'lịch sử và địa lí': '#FB7185',
  'lịch sử & địa lý': '#FB7185',
  'ls & đl': '#FB7185',

  // Đạo đức & GDCD
  'đạo đức': '#2DD4BF',
  'gdcd': '#0D9488',
  'giáo dục công dân': '#0D9488',
  'gdkt & pl': '#0284C7',

  // Nghệ thuật & Thể chất
  'mĩ thuật': '#EC4899',
  'mỹ thuật': '#EC4899',
  'nghệ thuật': '#F43F5E',
  'âm nhạc': '#F472B6',
  'hát nhạc': '#F472B6',
  'gdtc': '#84CC16',
  'thể dục': '#65A30D',
  'giáo dục thể chất': '#84CC16',
  'bơi lội': '#06B6D4',

  // Công nghệ & Hoạt động
  'tin học': '#6366F1',
  'công nghệ': '#4F46E5',
  'hđtn': '#F59E0B',
  'hoạt động trải nghiệm': '#F59E0B',
  'sinh hoạt dưới cờ': '#EAB308',
  'shdc': '#EAB308',
  'sinh hoạt lớp': '#FBBF24',
  'shl': '#FBBF24',
  'kỹ năng sống': '#10B981',
  'stem': '#8B5CF6',
  'robotics': '#06B6D4'
};

/**
 * Material symbols icon mapping for subjects
 */
export const getSubjectIcon = (subjectName: string): string => {
  if (!subjectName) return 'school';
  const lower = subjectName.toLowerCase();

  if (lower.includes('toán') || lower.includes('số học') || lower.includes('đại số') || lower.includes('hình học')) return 'calculate';
  if (lower.includes('văn') || lower.includes('tiếng việt') || lower.includes('vần') || lower.includes('viết') || lower.includes('chuyện')) return 'menu_book';
  if (lower.includes('anh') || lower.includes('ngoại ngữ') || lower.includes('pháp') || lower.includes('trung')) return 'language';
  if (lower.includes('lý') || lower.includes('vật lý') || lower.includes('vật lí')) return 'bolt';
  if (lower.includes('hóa')) return 'science';
  if (lower.includes('sinh') || lower.includes('khoa học') || lower.includes('tnxh') || lower.includes('tự nhiên')) return 'eco';
  if (lower.includes('sử') || lower.includes('lịch sử')) return 'history_edu';
  if (lower.includes('địa')) return 'public';
  if (lower.includes('đạo đức') || lower.includes('gdcd') || lower.includes('công dân')) return 'favorite';
  if (lower.includes('mĩ thuật') || lower.includes('mỹ thuật') || lower.includes('vẽ')) return 'palette';
  if (lower.includes('nhạc') || lower.includes('hát')) return 'music_note';
  if (lower.includes('thể dục') || lower.includes('gdtc') || lower.includes('bơi')) return 'fitness_center';
  if (lower.includes('tin') || lower.includes('công nghệ') || lower.includes('stem') || lower.includes('robot')) return 'computer';
  if (lower.includes('hđtn') || lower.includes('trải nghiệm') || lower.includes('sinh hoạt') || lower.includes('shdc') || lower.includes('shl')) return 'groups';

  return 'school';
};

/**
 * Deterministic hash to assign an aesthetic color if subject is unknown
 */
const HASH_COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899',
  '#06B6D4', '#F97316', '#14B8A6', '#84CC16', '#D946EF',
  '#0EA5E9', '#F43F5E', '#6366F1', '#EAB308', '#2DD4BF',
  '#A855F7', '#FB7185', '#22C55E'
];

export const hashNameToColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % HASH_COLOR_PALETTE.length;
  return HASH_COLOR_PALETTE[index];
};

/**
 * Get the color for a subject:
 * 1. Custom color if user configured it
 * 2. Predefined default mapping
 * 3. Keyword-based matching
 * 4. Deterministic hash
 */
export const getSubjectColor = (subjectName: string, customColors?: Record<string, string> | null): string => {
  if (!subjectName) return '#3B82F6';
  const trimmed = subjectName.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check user custom colors
  if (customColors) {
    if (customColors[trimmed]) return customColors[trimmed];
    if (customColors[lower]) return customColors[lower];
    // check case-insensitive match & cleaned name match
    for (const [key, val] of Object.entries(customColors)) {
      if (!val) continue;
      const kLower = key.trim().toLowerCase();
      if (kLower === lower) return val;
      const kClean = kLower
        .replace(/^(?:môn\s+)?(?:\(?\s*(?:t\.?\s*cường|tăng\s*cường|tc\.?|t\.c\.?|phụ\s*đạo|bồi\s*dưỡng)\s*\)?)\s*[\-_:]*\s*/i, '')
        .replace(/\s*[\-_:]*\s*(?:\(?\s*(?:t\.?\s*cường|tăng\s*cường|tc\.?|t\.c\.?|phụ\s*đạo|bồi\s*dưỡng)\s*\)?)$/i, '')
        .trim();
      if (kClean === lower) return val;
    }
  }

  // 2. Exact match in default
  if (DEFAULT_SUBJECT_COLORS[lower]) {
    return DEFAULT_SUBJECT_COLORS[lower];
  }

  // 3. Keyword matching
  for (const [key, color] of Object.entries(DEFAULT_SUBJECT_COLORS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return color;
    }
  }

  // 4. Deterministic hash
  return hashNameToColor(lower);
};

/**
 * Theme Presets for 1-click styling
 */
export interface ThemePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  palette: string[];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'smart',
    name: '🌟 Chuẩn Smart AI',
    icon: 'auto_awesome',
    description: 'Phối màu trực quan theo đặc trưng môn học của Bộ Giáo Dục.',
    palette: ['#3B82F6', '#8B5CF6', '#10B981', '#06B6D4', '#EC4899', '#F59E0B', '#84CC16', '#F43F5E']
  },
  {
    id: 'pastel',
    name: '🌸 Pastel Ngọt ngào',
    icon: 'spa',
    description: 'Tone màu pastel dịu nhẹ, êm mắt, tinh tế và thư giãn.',
    palette: ['#93C5FD', '#DDD6FE', '#A7F3D0', '#FDE68A', '#FBCFE8', '#FED7AA', '#A5F3FC', '#D9F99D', '#F5D0FE']
  },
  {
    id: 'neon',
    name: '⚡ Neon Năng động',
    icon: 'bolt',
    description: 'Rực rỡ, tương phản cao, phong cách công nghệ sắc nét.',
    palette: ['#00F0FF', '#FF007F', '#39FF14', '#9D00FF', '#FFE600', '#FF3838', '#00FF9F', '#FF6600']
  },
  {
    id: 'nature',
    name: '🌿 Thiên nhiên Mát dịu',
    icon: 'forest',
    description: 'Gam màu xanh ngọc bích, cỏ cây và trời biển trong lành.',
    palette: ['#059669', '#0D9488', '#0284C7', '#10B981', '#65A30D', '#14B8A6', '#84CC16', '#047857']
  },
  {
    id: 'classic',
    name: '🎓 Học viện Thanh lịch',
    icon: 'local_library',
    description: 'Gam màu học thuật chuẩn mực, sâu lắng và tập trung cao.',
    palette: ['#2563EB', '#7C3AED', '#047857', '#C2410C', '#B91C1C', '#4338CA', '#0891B2', '#475569']
  }
];

/**
 * Generate comprehensive style objects for a subject card and badge
 */
export interface CardColorStyles {
  hex: string;
  cardStyle: React.CSSProperties;
  badgeStyle: React.CSSProperties;
  glowStyle: React.CSSProperties;
  iconColor: string;
}

export const generateSubjectStyles = (hexColor: string, isDarkMode = true): CardColorStyles => {
  const hex = hexColor || '#3B82F6';
  const lum = getLuminance(hex);

  // Card Background: Translucent wash
  const cardBgAlpha = isDarkMode ? 0.12 : 0.08;
  const cardBorderAlpha = isDarkMode ? 0.35 : 0.28;
  const badgeBgAlpha = isDarkMode ? 0.22 : 0.16;
  const badgeBorderAlpha = isDarkMode ? 0.45 : 0.35;

  const cardBg = hexToRgba(hex, cardBgAlpha);
  const cardBorder = hexToRgba(hex, cardBorderAlpha);
  const badgeBg = hexToRgba(hex, badgeBgAlpha);
  const badgeBorder = hexToRgba(hex, badgeBorderAlpha);

  // Badge Text Color:
  // For dark mode: light & vibrant
  // For light mode: high saturation & dark enough to read easily
  let badgeTextColor = hex;
  if (isDarkMode) {
    if (lum < 90) {
      badgeTextColor = adjustHexBrightness(hex, 45); // brighten dark colors
    } else {
      badgeTextColor = adjustHexBrightness(hex, 15);
    }
  } else {
    if (lum > 140) {
      badgeTextColor = adjustHexBrightness(hex, -40); // darken light colors for readability
    } else {
      badgeTextColor = adjustHexBrightness(hex, -15);
    }
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: cardBg,
    borderColor: cardBorder,
    borderWidth: '1px',
    borderStyle: 'solid',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: badgeBg,
    borderColor: badgeBorder,
    borderWidth: '1px',
    borderStyle: 'solid',
    color: badgeTextColor,
  };

  const glowStyle: React.CSSProperties = {
    boxShadow: `0 4px 16px ${hexToRgba(hex, isDarkMode ? 0.25 : 0.15)}`,
  };

  return {
    hex,
    cardStyle,
    badgeStyle,
    glowStyle,
    iconColor: badgeTextColor,
  };
};

/**
 * Auto-harmonize: Distributes distinct non-overlapping colors to all subjects
 */
export const autoHarmonizePalette = (
  subjects: string[],
  themeId = 'smart'
): Record<string, string> => {
  const result: Record<string, string> = {};
  const preset = THEME_PRESETS.find(p => p.id === themeId) || THEME_PRESETS[0];

  if (themeId === 'smart') {
    // In smart mode, use default mapped colors first. If conflict occurs, pick next unused color.
    const usedColors = new Set<string>();
    subjects.forEach((subj) => {
      let color = getSubjectColor(subj, null);
      if (usedColors.has(color)) {
        // Find next unused color in curated palette
        const alternative = CURATED_PALETTE_COLORS.find(c => !usedColors.has(c.hex))?.hex || color;
        color = alternative;
      }
      usedColors.add(color);
      result[subj] = color;
    });
  } else {
    // In preset theme mode, cycle through theme's palette smoothly
    const palette = preset.palette;
    subjects.forEach((subj, idx) => {
      result[subj] = palette[idx % palette.length];
    });
  }

  return result;
};

// Local storage key for fallback and instant loading
export const SUBJECT_COLORS_STORAGE_KEY = 'ai_tutor_subject_colors_v1';
