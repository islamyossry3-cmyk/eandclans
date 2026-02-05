import { useEffect, useState } from 'react';
import { eandColors } from '../../constants/eandColors';
import { Star, Zap, Trophy, Target } from 'lucide-react';

interface ScorePopupProps {
  points: number;
  isCorrect: boolean;
  streak?: number;
  show: boolean;
  onComplete?: () => void;
}

export function ScorePopup({ points, isCorrect, streak = 0, show, onComplete }: ScorePopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  const getStreakMessage = () => {
    if (streak >= 5) return { text: 'ON FIRE! 🔥', icon: Zap };
    if (streak >= 3) return { text: 'STREAK! ⚡', icon: Star };
    if (streak >= 2) return { text: 'COMBO! ✨', icon: Target };
    return null;
  };

  const streakInfo = getStreakMessage();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-score-pop">
        {isCorrect ? (
          <div className="text-center">
            <div
              className="text-6xl md:text-8xl font-black mb-2"
              style={{
                color: eandColors.brightGreen,
                textShadow: `0 0 20px ${eandColors.brightGreen}80, 0 4px 8px rgba(0,0,0,0.3)`,
              }}
            >
              +{points}
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: eandColors.brightGreen }}
            >
              CORRECT!
            </div>
            {streakInfo && (
              <div
                className="mt-2 flex items-center justify-center gap-2 text-xl font-bold animate-bounce"
                style={{ color: eandColors.red }}
              >
                <streakInfo.icon className="w-6 h-6" />
                {streakInfo.text}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center animate-shake">
            <div
              className="text-6xl md:text-8xl font-black mb-2"
              style={{
                color: eandColors.red,
                textShadow: `0 0 20px ${eandColors.red}80, 0 4px 8px rgba(0,0,0,0.3)`,
              }}
            >
              ✗
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: eandColors.red }}
            >
              WRONG!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PointsFloaterProps {
  points: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export function PointsFloater({ points, x, y, onComplete }: PointsFloaterProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-50 animate-fade-in-up"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span
        className="text-3xl font-black"
        style={{
          color: points > 0 ? eandColors.brightGreen : eandColors.red,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {points > 0 ? `+${points}` : points}
      </span>
    </div>
  );
}

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon?: 'trophy' | 'star' | 'zap' | 'target';
  show: boolean;
  onComplete?: () => void;
}

export function AchievementBadge({ title, description, icon = 'trophy', show, onComplete }: AchievementBadgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  const IconComponent = {
    trophy: Trophy,
    star: Star,
    zap: Zap,
    target: Target,
  }[icon];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
      <div
        className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 100%)`,
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center animate-wiggle"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">{title}</p>
          <p className="text-white/80 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}
