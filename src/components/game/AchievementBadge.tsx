import { useState, useEffect } from 'react';
import { Trophy, Target, Zap, Crown, Star, Award, Flame, Shield } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';

export type AchievementType =
  | 'first_answer'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'territory_claimed'
  | 'territory_master'
  | 'speed_demon'
  | 'perfect_round'
  | 'team_player'
  | 'mvp';

interface AchievementConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Record<AchievementType, AchievementConfig> = {
  first_answer: {
    icon: <Star className="w-8 h-8" />,
    title: 'First Blood',
    description: 'Answer your first question',
    color: eandColors.brightGreen,
    rarity: 'common',
  },
  streak_3: {
    icon: <Flame className="w-8 h-8" />,
    title: 'On Fire',
    description: '3 correct answers in a row',
    color: eandColors.red,
    rarity: 'common',
  },
  streak_5: {
    icon: <Zap className="w-8 h-8" />,
    title: 'Lightning Fast',
    description: '5 correct answers in a row',
    color: '#FFD700',
    rarity: 'rare',
  },
  streak_10: {
    icon: <Crown className="w-8 h-8" />,
    title: 'Unstoppable',
    description: '10 correct answers in a row',
    color: '#FF6B00',
    rarity: 'legendary',
  },
  territory_claimed: {
    icon: <Target className="w-8 h-8" />,
    title: 'Conqueror',
    description: 'Claim your first territory',
    color: eandColors.oceanBlue,
    rarity: 'common',
  },
  territory_master: {
    icon: <Shield className="w-8 h-8" />,
    title: 'Territory Master',
    description: 'Claim 5 territories',
    color: eandColors.mauve,
    rarity: 'epic',
  },
  speed_demon: {
    icon: <Zap className="w-8 h-8" />,
    title: 'Speed Demon',
    description: 'Answer in under 3 seconds',
    color: '#00D4FF',
    rarity: 'rare',
  },
  perfect_round: {
    icon: <Award className="w-8 h-8" />,
    title: 'Perfect Round',
    description: 'Answer all questions correctly',
    color: '#FFD700',
    rarity: 'epic',
  },
  team_player: {
    icon: <Star className="w-8 h-8" />,
    title: 'Team Player',
    description: 'Contribute to team victory',
    color: eandColors.brightGreen,
    rarity: 'common',
  },
  mvp: {
    icon: <Trophy className="w-8 h-8" />,
    title: 'MVP',
    description: 'Top scorer of the game',
    color: '#FFD700',
    rarity: 'legendary',
  },
};

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

interface AchievementBadgeProps {
  type: AchievementType;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onAnimationComplete?: () => void;
}

export function AchievementBadge({
  type,
  showAnimation = false,
  size = 'md',
  onAnimationComplete,
}: AchievementBadgeProps) {
  const [isVisible, setIsVisible] = useState(showAnimation);
  const achievement = ACHIEVEMENTS[type];

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onAnimationComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation, onAnimationComplete]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (showAnimation && !isVisible) return null;

  const badge = (
    <div
      className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} p-1 shadow-lg`}
      style={{
        boxShadow: `0 0 20px ${achievement.color}60`,
      }}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{ backgroundColor: achievement.color }}
      >
        <div className={iconSizes[size]} style={{ color: 'white' }}>
          {achievement.icon}
        </div>
      </div>
    </div>
  );

  if (showAnimation) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="flex flex-col items-center gap-4"
          style={{ animation: 'achievementPopIn 0.5s ease-out' }}
        >
          <div style={{ animation: 'achievementGlow 1.5s ease-in-out infinite' }}>
            {badge}
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold text-white drop-shadow-lg"
              style={{ textShadow: `0 0 20px ${achievement.color}` }}
            >
              🏆 {achievement.title}
            </div>
            <div className="text-white/80 text-sm mt-1">{achievement.description}</div>
          </div>
        </div>

        <style>{`
          @keyframes achievementPopIn {
            0% {
              transform: scale(0) rotate(-180deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.3) rotate(10deg);
            }
            100% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes achievementGlow {
            0%, 100% {
              filter: drop-shadow(0 0 10px ${achievement.color}80);
            }
            50% {
              filter: drop-shadow(0 0 30px ${achievement.color});
            }
          }
        `}</style>
      </div>
    );
  }

  return badge;
}

interface AchievementToastProps {
  achievements: AchievementType[];
  onDismiss: (type: AchievementType) => void;
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  // Auto-dismiss achievements after 3s
  useEffect(() => {
    if (achievements.length === 0) return;
    const timer = setTimeout(() => {
      onDismiss(achievements[0]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [achievements, onDismiss]);

  // Only show the most recent achievement on mobile to prevent overlap
  const visibleAchievements = achievements.slice(0, 2);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-auto">
      {visibleAchievements.map((type, index) => {
        const achievement = ACHIEVEMENTS[type];
        return (
          <div
            key={type}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl cursor-pointer backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${achievement.color}cc 0%, ${achievement.color}ee 100%)`,
              border: `2px solid ${achievement.color}`,
              animation: `slideDown 0.3s ease-out ${index * 0.1}s both`,
              opacity: index === 0 ? 1 : 0.9,
            }}
            onClick={() => onDismiss(type)}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
            >
              <div className="w-5 h-5 text-white">{achievement.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">{achievement.title}</div>
              <div className="text-white/80 text-xs truncate">{achievement.description}</div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
