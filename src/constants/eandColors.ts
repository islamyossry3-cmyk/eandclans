// e& Brand Colors (Official Brand Guidelines v3.0)
export const eandColors = {
  // Primary e& Colors
  red: '#E00800',          // e& Red - Primary brand color
  oceanBlue: '#18114B',    // e& Ocean Blue - Secondary brand color
  brightGreen: '#47CB6C',  // e& Bright Green - Accent color

  // Supporting Brand Colors
  burgundy: '#7C0124',     // e& Burgundy
  darkGreen: '#16363A',    // e& Dark Green
  mauve: '#631C46',        // e& Mauve
  sandRed: '#D18D86',      // e& Sand Red
  beige: '#E2E2D7',        // e& Beige

  // Neutral Colors
  white: '#FFFFFF',
  grey: '#71716F',         // e& Grey
  mediumGrey: '#9C9C99',   // e& Medium Grey
  lightGrey: '#DADAD7',    // e& Light Grey

  // Status Colors
  success: '#47CB6C',      // Using e& Bright Green
  warning: '#D18D96',      // Using e& Sand Red
  error: '#E00800',        // Using e& Red
  info: '#18114B',         // Using e& Ocean Blue
} as const;

export const eandGradients = {
  // Primary Gradients
  primary: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`,
  secondary: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0f0c35 100%)`,
  accent: `linear-gradient(135deg, ${eandColors.brightGreen} 0%, #3ab85d 100%)`,
  hero: `linear-gradient(135deg, ${eandColors.oceanBlue}f0 0%, ${eandColors.red}d0 50%, ${eandColors.darkGreen}f0 100%)`,

  // Component Gradients
  button: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`,
  buttonSecondary: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0f0c35 100%)`,
  card: `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 245, 245, 0.98) 100%)`,
  overlay: `linear-gradient(135deg, ${eandColors.oceanBlue}f0 0%, ${eandColors.red}d0 50%, ${eandColors.darkGreen}f0 100%)`,
} as const;
