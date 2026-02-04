interface TeamIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  maskShape?: 'circle' | 'hexagon' | 'shield' | 'none';
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-2xl',
  md: 'w-8 h-8 text-3xl',
  lg: 'w-12 h-12 text-4xl',
  xl: 'w-16 h-16 text-5xl',
  '2xl': 'w-20 h-20 text-6xl',
  '3xl': 'w-32 h-32 text-7xl',
  'full': 'w-full h-auto',
};

export function TeamIcon({ icon, size = 'md', className = '', maskShape = 'none', style }: TeamIconProps) {
  const isUrl = icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:');

  if (isUrl) {
    if (maskShape === 'none' || size === 'full') {
      return (
        <img
          src={icon}
          alt="Team icon"
          className={`${size === 'full' ? 'w-full h-auto' : sizeClasses[size]} object-contain ${className}`}
          style={{ maxWidth: '100%', ...style }}
        />
      );
    }

    const getMaskStyle = () => {
      switch (maskShape) {
        case 'circle':
          return { clipPath: 'circle(50%)' };
        case 'hexagon':
          return { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
        case 'shield':
          return { clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)' };
        default:
          return {};
      }
    };

    return (
      <div className={`${sizeClasses[size]} overflow-hidden ${className}`}>
        <img
          src={icon}
          alt="Team icon"
          className="w-full h-full object-cover"
          style={getMaskStyle()}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`} style={style}>
      {icon}
    </div>
  );
}
