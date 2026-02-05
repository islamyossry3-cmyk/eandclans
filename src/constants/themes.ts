export type ThemeType = 'innovation' | 'excellence' | 'integrity' | 'customer-focus' | 'collaboration' | 'empowerment';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  nameAr: string;
  value: string;
  valueAr: string;
  description: string;
  descriptionAr: string;
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

export const THEMES: Record<ThemeType, ThemeConfig> = {
  innovation: {
    id: 'innovation',
    name: 'Innovation',
    nameAr: 'الابتكار',
    value: 'We embrace innovation and drive forward-thinking solutions',
    valueAr: 'نحتضن الابتكار ونقود الحلول المستقبلية',
    description: 'Pioneering new ideas and technologies to transform the future',
    descriptionAr: 'ريادة الأفكار والتقنيات الجديدة لتحويل المستقبل',
    colors: {
      primary: '#47CB6C',
      secondary: '#38a059',
      accent: '#5fe086',
      background: '#16363A',
      overlay: 'rgba(22, 54, 58, 0.90)',
    },
    gradients: {
      lobby: 'linear-gradient(135deg, #16363A 0%, #1e4a50 50%, #265e66 100%)',
      player: 'linear-gradient(135deg, #47CB6C 0%, #38a059 50%, #5fe086 100%)',
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858829292_Gemini_Generated_Image_nsu7i9nsu7i9nsu7.png',
  },
  excellence: {
    id: 'excellence',
    name: 'Excellence',
    nameAr: 'التميز',
    value: 'We pursue excellence in everything we do',
    valueAr: 'نسعى للتميز في كل ما نفعله',
    description: 'Setting the highest standards and delivering superior quality',
    descriptionAr: 'وضع أعلى المعايير وتقديم جودة فائقة',
    colors: {
      primary: '#E00800',
      secondary: '#7C0124',
      accent: '#ff3020',
      background: '#18114B',
      overlay: 'rgba(24, 17, 75, 0.90)',
    },
    gradients: {
      lobby: 'linear-gradient(135deg, #18114B 0%, #2a1f6b 50%, #3d2d8b 100%)',
      player: 'linear-gradient(135deg, #E00800 0%, #7C0124 50%, #ff3020 100%)',
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858802923_Gemini_Generated_Image_pxbh5ypxbh5ypxbh.png',
  },
  integrity: {
    id: 'integrity',
    name: 'Integrity',
    nameAr: 'النزاهة',
    value: 'We act with honesty, transparency, and responsibility',
    valueAr: 'نتصرف بصدق وشفافية ومسؤولية',
    description: 'Building trust through ethical conduct and accountability',
    descriptionAr: 'بناء الثقة من خلال السلوك الأخلاقي والمساءلة',
    colors: {
      primary: '#18114B',
      secondary: '#2a1f6b',
      accent: '#3d2d8b',
      background: '#1a1a1a',
      overlay: 'rgba(26, 26, 26, 0.90)',
    },
    gradients: {
      lobby: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #3a3a3a 100%)',
      player: 'linear-gradient(135deg, #18114B 0%, #2a1f6b 50%, #3d2d8b 100%)',
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764854123595_Gemini_Generated_Image_mas5e5mas5e5mas5.png',
  },
  'customer-focus': {
    id: 'customer-focus',
    name: 'Customer Focus',
    nameAr: 'التركيز على العميل',
    value: 'We put our customers at the heart of everything',
    valueAr: 'نضع عملائنا في قلب كل شيء',
    description: 'Delivering exceptional experiences that exceed expectations',
    descriptionAr: 'تقديم تجارب استثنائية تفوق التوقعات',
    colors: {
      primary: '#631C46',
      secondary: '#7C0124',
      accent: '#D18D86',
      background: '#18114B',
      overlay: 'rgba(24, 17, 75, 0.90)',
    },
    gradients: {
      lobby: 'linear-gradient(135deg, #18114B 0%, #631C46 50%, #7C0124 100%)',
      player: 'linear-gradient(135deg, #631C46 0%, #7C0124 50%, #D18D86 100%)',
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858818161_Gemini_Generated_Image_fssvwtfssvwtfssv%20(1).png',
  },
  collaboration: {
    id: 'collaboration',
    name: 'Collaboration',
    nameAr: 'التعاون',
    value: 'We work together to achieve shared success',
    valueAr: 'نعمل معاً لتحقيق النجاح المشترك',
    description: 'Fostering teamwork and partnership across all levels',
    descriptionAr: 'تعزيز العمل الجماعي والشراكة على جميع المستويات',
    colors: {
      primary: '#47CB6C',
      secondary: '#16363A',
      accent: '#5fe086',
      background: '#18114B',
      overlay: 'rgba(24, 17, 75, 0.85)',
    },
    gradients: {
      lobby: 'linear-gradient(135deg, #18114B 0%, #16363A 50%, #47CB6C 100%)',
      player: 'linear-gradient(135deg, #47CB6C 0%, #38a059 50%, #5fe086 100%)',
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764858829292_Gemini_Generated_Image_nsu7i9nsu7i9nsu7.png',
  },
  empowerment: {
    id: 'empowerment',
    name: 'Empowerment',
    nameAr: 'التمكين',
    value: 'We empower our people to reach their full potential',
    valueAr: 'نمكّن موظفينا للوصول إلى كامل إمكاناتهم',
    description: 'Enabling growth, development, and leadership at every level',
    descriptionAr: 'تمكين النمو والتطوير والقيادة على كل مستوى',
    colors: {
      primary: '#E00800',
      secondary: '#47CB6C',
      accent: '#ff3020',
      background: '#18114B',
      overlay: 'rgba(24, 17, 75, 0.88)',
    },
    gradients: {
      lobby: 'linear-gradient(135deg, #18114B 0%, #E00800 50%, #47CB6C 100%)',
      player: 'linear-gradient(135deg, #E00800 0%, #7C0124 50%, #ff3020 100%)',
    },
    backgroundImage: 'https://fujvvjcvirkoyrmvxegf.supabase.co/storage/v1/object/public/game-assets/islands/1764854123595_Gemini_Generated_Image_mas5e5mas5e5mas5.png',
  },
};

export function getTheme(themeId: ThemeType): ThemeConfig {
  return THEMES[themeId] || THEMES.innovation;
}
