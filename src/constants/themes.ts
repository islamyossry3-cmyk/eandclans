import { eandColors } from './eandColors';

export type ThemeType =
  | 'win-together'
  | 'build-capabilities'
  | 'push-boundaries'
  | 'champion-innovation'
  | 'leverage-data-ai'
  | 'exceed-expectations';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  nameAr: string;
  valueGroup: string;
  valueGroupAr: string;
  emoji: string;
  description: string;
  descriptionAr: string;
  indicators: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    overlay: string;
  };
  gradients: {
    lobby: string;
    player: string;
  };
  backgroundImage: string;
}

// ── Unite as One& ────────────────────────────────────────
// Value icon: connected dots cluster (🤝)
export const THEMES: Record<ThemeType, ThemeConfig> = {
  'win-together': {
    id: 'win-together',
    name: 'Win Together',
    nameAr: 'الفوز معاً',
    valueGroup: 'Unite as One&',
    valueGroupAr: 'نتحد كفريق واحد',
    emoji: '🤝',
    description: 'Collaborate as one team to achieve shared success',
    descriptionAr: 'التعاون كفريق واحد لتحقيق النجاح المشترك',
    indicators: ['Collaborate as one team', 'Celebrate diversity & inclusion', 'Commit to sustainability'],
    colors: {
      primary: eandColors.brightGreen,
      secondary: '#38a059',
      accent: '#5fe086',
      background: eandColors.darkGreen,
      overlay: 'rgba(22, 54, 58, 0.90)',
    },
    gradients: {
      lobby: `linear-gradient(135deg, ${eandColors.darkGreen} 0%, #1e4a50 50%, #265e66 100%)`,
      player: `linear-gradient(135deg, ${eandColors.brightGreen} 0%, #38a059 50%, #5fe086 100%)`,
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858829292_Gemini_Generated_Image_nsu7i9nsu7i9nsu7.png',
  },
  'build-capabilities': {
    id: 'build-capabilities',
    name: 'Build Capabilities',
    nameAr: 'بناء القدرات',
    valueGroup: 'Unite as One&',
    valueGroupAr: 'نتحد كفريق واحد',
    emoji: '🤝',
    description: 'Empower self & others, learn & improve, develop talent',
    descriptionAr: 'تمكين الذات والآخرين، التعلم والتحسين، تطوير المواهب',
    indicators: ['Empower self & others', 'Learn & improve', 'Develop talent'],
    colors: {
      primary: eandColors.brightGreen,
      secondary: eandColors.darkGreen,
      accent: '#5fe086',
      background: eandColors.oceanBlue,
      overlay: 'rgba(24, 17, 75, 0.85)',
    },
    gradients: {
      lobby: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.darkGreen} 50%, ${eandColors.brightGreen} 100%)`,
      player: `linear-gradient(135deg, ${eandColors.brightGreen} 0%, #38a059 50%, #5fe086 100%)`,
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858829292_Gemini_Generated_Image_nsu7i9nsu7i9nsu7.png',
  },

  // ── Dare to be Bold ────────────────────────────────────
  // Value icon: diamond/faceted gem (💎)
  'push-boundaries': {
    id: 'push-boundaries',
    name: 'Push Boundaries',
    nameAr: 'تجاوز الحدود',
    valueGroup: 'Dare to be Bold',
    valueGroupAr: 'تجرّأ وكن جريئاً',
    emoji: '💎',
    description: 'Disrupt the status quo, experiment fearlessly, drive & own results',
    descriptionAr: 'كسر الوضع الراهن، التجربة بلا خوف، قيادة النتائج وامتلاكها',
    indicators: ['Disrupt the status quo', 'Experiment fearlessly', 'Drive & own results'],
    colors: {
      primary: eandColors.red,
      secondary: eandColors.burgundy,
      accent: '#ff3020',
      background: eandColors.oceanBlue,
      overlay: 'rgba(24, 17, 75, 0.90)',
    },
    gradients: {
      lobby: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #2a1f6b 50%, #3d2d8b 100%)`,
      player: `linear-gradient(135deg, ${eandColors.red} 0%, ${eandColors.burgundy} 50%, #ff3020 100%)`,
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858802923_Gemini_Generated_Image_pxbh5ypxbh5ypxbh.png',
  },
  'champion-innovation': {
    id: 'champion-innovation',
    name: 'Champion Innovation',
    nameAr: 'قيادة الابتكار',
    valueGroup: 'Dare to be Bold',
    valueGroupAr: 'تجرّأ وكن جريئاً',
    emoji: '💎',
    description: 'Be curious & creative, foster new solutions, navigate uncertainty',
    descriptionAr: 'كن فضولياً ومبدعاً، عزز الحلول الجديدة، تعامل مع عدم اليقين',
    indicators: ['Be curious & creative', 'Foster new solutions', 'Navigate uncertainty'],
    colors: {
      primary: eandColors.oceanBlue,
      secondary: '#2a1f6b',
      accent: '#3d2d8b',
      background: eandColors.grey,
      overlay: 'rgba(26, 26, 26, 0.90)',
    },
    gradients: {
      lobby: `linear-gradient(135deg, ${eandColors.grey} 0%, #2a2a2a 50%, #3a3a3a 100%)`,
      player: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #2a1f6b 50%, #3d2d8b 100%)`,
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764854123595_Gemini_Generated_Image_mas5e5mas5e5mas5.png',
  },

  // ── Be Customer Obsessed ───────────────────────────────
  // Value icon: bullseye / target (🎯)
  'leverage-data-ai': {
    id: 'leverage-data-ai',
    name: 'Leverage Data & AI',
    nameAr: 'استثمار البيانات والذكاء الاصطناعي',
    valueGroup: 'Be Customer Obsessed',
    valueGroupAr: 'كن مهووساً بالعميل',
    emoji: '🎯',
    description: 'Empower with technology, make informed decisions, solve complex problems',
    descriptionAr: 'التمكين بالتكنولوجيا، اتخاذ قرارات مستنيرة، حل المشكلات المعقدة',
    indicators: ['Empower with Technology', 'Make informed decisions', 'Solve complex problems'],
    colors: {
      primary: eandColors.mauve,
      secondary: eandColors.burgundy,
      accent: eandColors.sandRed,
      background: eandColors.oceanBlue,
      overlay: 'rgba(24, 17, 75, 0.90)',
    },
    gradients: {
      lobby: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 50%, ${eandColors.burgundy} 100%)`,
      player: `linear-gradient(135deg, ${eandColors.mauve} 0%, ${eandColors.burgundy} 50%, ${eandColors.sandRed} 100%)`,
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858818161_Gemini_Generated_Image_fssvwtfssvwtfssv%20(1).png',
  },
  'exceed-expectations': {
    id: 'exceed-expectations',
    name: 'Exceed Expectations',
    nameAr: 'تجاوز التوقعات',
    valueGroup: 'Be Customer Obsessed',
    valueGroupAr: 'كن مهووساً بالعميل',
    emoji: '🎯',
    description: 'Own our brand, deliver differentiated service, build partnerships',
    descriptionAr: 'امتلاك علامتنا التجارية، تقديم خدمة متميزة، بناء الشراكات',
    indicators: ['Own our brand', 'Deliver differentiated service', 'Build partnerships'],
    colors: {
      primary: eandColors.red,
      secondary: eandColors.brightGreen,
      accent: '#ff3020',
      background: eandColors.oceanBlue,
      overlay: 'rgba(24, 17, 75, 0.88)',
    },
    gradients: {
      lobby: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.red} 50%, ${eandColors.brightGreen} 100%)`,
      player: `linear-gradient(135deg, ${eandColors.red} 0%, ${eandColors.burgundy} 50%, #ff3020 100%)`,
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764854123595_Gemini_Generated_Image_mas5e5mas5e5mas5.png',
  },
};

// Backward compatibility: map old theme IDs to new ones
const LEGACY_MAP: Record<string, ThemeType> = {
  'innovation': 'champion-innovation',
  'excellence': 'push-boundaries',
  'integrity': 'champion-innovation',
  'customer-focus': 'leverage-data-ai',
  'collaboration': 'win-together',
  'empowerment': 'build-capabilities',
};

export function getTheme(themeId: string): ThemeConfig {
  if (themeId in THEMES) return THEMES[themeId as ThemeType];
  if (themeId in LEGACY_MAP) return THEMES[LEGACY_MAP[themeId]];
  return THEMES['win-together'];
}
