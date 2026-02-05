import { useMemo } from 'react';
import { User, Crown, Star, Zap, Shield, Flame, Target } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';

interface PlayerAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  score?: number;
  isLeader?: boolean;
  streak?: number;
  showBadge?: boolean;
  teamColor?: string;
}

const AVATAR_COLORS = [
  { bg: eandColors.red, text: '#FFFFFF' },
  { bg: eandColors.oceanBlue, text: '#FFFFFF' },
  { bg: eandColors.brightGreen, text: '#FFFFFF' },
  { bg: eandColors.burgundy, text: '#FFFFFF' },
  { bg: eandColors.mauve, text: '#FFFFFF' },
  { bg: eandColors.darkGreen, text: '#FFFFFF' },
  { bg: '#FFD700', text: '#1a1a1a' },
  { bg: '#FF6B6B', text: '#FFFFFF' },
  { bg: '#4ECDC4', text: '#1a1a1a' },
  { bg: '#9B59B6', text: '#FFFFFF' },
];

const AVATAR_PATTERNS = [
  { icon: User, rotation: 0 },
  { icon: Star, rotation: 15 },
  { icon: Zap, rotation: -10 },
  { icon: Shield, rotation: 5 },
  { icon: Flame, rotation: -5 },
  { icon: Target, rotation: 10 },
];

export function PlayerAvatar({
  name,
  size = 'md',
  score = 0,
  isLeader = false,
  streak = 0,
  showBadge = true,
  teamColor,
}: PlayerAvatarProps) {
  const { colorIndex, patternIndex, initials } = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIdx = Math.abs(hash) % AVATAR_COLORS.length;
    const patternIdx = Math.abs(hash >> 4) % AVATAR_PATTERNS.length;
    
    const words = name.trim().split(/\s+/);
    const init = words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

    return { colorIndex: colorIdx, patternIndex: patternIdx, initials: init };
  }, [name]);

  const avatarColor = teamColor ? { bg: teamColor, text: '#FFFFFF' } : AVATAR_COLORS[colorIndex];
  const pattern = AVATAR_PATTERNS[patternIndex];

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const badgeSizes = {
    xs: 'w-3 h-3 -top-0.5 -right-0.5',
    sm: 'w-4 h-4 -top-1 -right-1',
    md: 'w-5 h-5 -top-1 -right-1',
    lg: 'w-6 h-6 -top-1 -right-1',
    xl: 'w-8 h-8 -top-2 -right-2',
  };

  const getBadge = () => {
    if (isLeader) {
      return (
        <div
          className={`absolute ${badgeSizes[size]} rounded-full flex items-center justify-center`}
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            boxShadow: '0 0 10px #FFD70080',
          }}
        >
          <Crown className="w-3/4 h-3/4 text-white" />
        </div>
      );
    }

    if (streak >= 5) {
      return (
        <div
          className={`absolute ${badgeSizes[size]} rounded-full flex items-center justify-center`}
          style={{
            background: `linear-gradient(135deg, ${eandColors.red} 0%, #FF6B00 100%)`,
            animation: 'pulse 1s ease-in-out infinite',
          }}
        >
          <Flame className="w-3/4 h-3/4 text-white" />
        </div>
      );
    }

    if (score >= 100) {
      return (
        <div
          className={`absolute ${badgeSizes[size]} rounded-full flex items-center justify-center`}
          style={{
            background: `linear-gradient(135deg, ${eandColors.brightGreen} 0%, #38a059 100%)`,
          }}
        >
          <Star className="w-3/4 h-3/4 text-white" />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-110`}
        style={{
          background: `linear-gradient(135deg, ${avatarColor.bg} 0%, ${avatarColor.bg}CC 100%)`,
          color: avatarColor.text,
          transform: `rotate(${pattern.rotation}deg)`,
          boxShadow: `0 4px 15px ${avatarColor.bg}40`,
        }}
      >
        <span style={{ transform: `rotate(${-pattern.rotation}deg)` }}>{initials}</span>
      </div>
      {showBadge && getBadge()}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

interface PlayerAvatarGroupProps {
  players: { id: string; name: string; score?: number }[];
  maxDisplay?: number;
  size?: 'xs' | 'sm' | 'md';
  teamColor?: string;
}

export function PlayerAvatarGroup({
  players,
  maxDisplay = 5,
  size = 'sm',
  teamColor,
}: PlayerAvatarGroupProps) {
  const displayPlayers = players.slice(0, maxDisplay);
  const remainingCount = players.length - maxDisplay;

  const overlapClasses = {
    xs: '-ml-2',
    sm: '-ml-3',
    md: '-ml-4',
  };

  return (
    <div className="flex items-center">
      {displayPlayers.map((player, index) => (
        <div
          key={player.id}
          className={index > 0 ? overlapClasses[size] : ''}
          style={{ zIndex: displayPlayers.length - index }}
        >
          <PlayerAvatar
            name={player.name}
            size={size}
            score={player.score}
            teamColor={teamColor}
            showBadge={false}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${overlapClasses[size]} ${
            size === 'xs' ? 'w-6 h-6 text-xs' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
          } rounded-full flex items-center justify-center font-bold text-white`}
          style={{
            background: eandColors.grey,
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
