import { Flame, Zap, Star, Target } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';

interface StreakIndicatorProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakIndicator({ streak, size = 'md' }: StreakIndicatorProps) {
  if (streak < 2) return null;

  const sizes = {
    sm: { container: 'px-2 py-1 text-xs', icon: 'w-3 h-3' },
    md: { container: 'px-3 py-1.5 text-sm', icon: 'w-4 h-4' },
    lg: { container: 'px-4 py-2 text-base', icon: 'w-5 h-5' },
  };

  const getStreakConfig = () => {
    if (streak >= 10) {
      return {
        icon: Flame,
        label: 'LEGENDARY!',
        gradient: `linear-gradient(135deg, #ff6b00 0%, ${eandColors.red} 100%)`,
        animate: 'animate-pulse',
      };
    }
    if (streak >= 5) {
      return {
        icon: Zap,
        label: 'ON FIRE!',
        gradient: `linear-gradient(135deg, ${eandColors.red} 0%, #ff6b00 100%)`,
        animate: 'animate-bounce',
      };
    }
    if (streak >= 3) {
      return {
        icon: Star,
        label: 'HOT STREAK!',
        gradient: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.brightGreen} 100%)`,
        animate: 'animate-wiggle',
      };
    }
    return {
      icon: Target,
      label: 'COMBO!',
      gradient: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 100%)`,
      animate: '',
    };
  };

  const config = getStreakConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold text-white ${sizes[size].container} ${config.animate}`}
      style={{ background: config.gradient }}
    >
      <IconComponent className={sizes[size].icon} />
      <span>{streak}x {config.label}</span>
    </div>
  );
}

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  showWarning?: boolean;
}

export function TimerBar({ timeRemaining, totalTime, showWarning = true }: TimerBarProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  const isLow = percentage <= 25;
  const isCritical = percentage <= 10;

  const getColor = () => {
    if (isCritical) return eandColors.red;
    if (isLow) return '#ff6b00';
    return eandColors.brightGreen;
  };

  return (
    <div className="w-full">
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: `${eandColors.oceanBlue}30` }}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${isCritical ? 'animate-pulse' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
      {showWarning && isCritical && (
        <p
          className="text-center text-sm font-bold mt-1 animate-pulse"
          style={{ color: eandColors.red }}
        >
          HURRY UP!
        </p>
      )}
    </div>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = eandColors.brightGreen,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`${eandColors.oceanBlue}30`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
