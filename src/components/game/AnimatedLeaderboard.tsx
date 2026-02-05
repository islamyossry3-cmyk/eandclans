import { useState, useEffect, useRef } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';
import { PlayerAvatar } from './PlayerAvatar';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  previousRank?: number;
  territoriesClaimed?: number;
  correctAnswers?: number;
}

interface AnimatedLeaderboardProps {
  entries: LeaderboardEntry[];
  teamColor?: string;
  title?: string;
  maxDisplay?: number;
  currentPlayerId?: string;
}

export function AnimatedLeaderboard({
  entries,
  teamColor = eandColors.oceanBlue,
  title = 'Leaderboard',
  maxDisplay = 10,
  currentPlayerId,
}: AnimatedLeaderboardProps) {
  const [animatedEntries, setAnimatedEntries] = useState<LeaderboardEntry[]>([]);
  const prevEntriesRef = useRef<LeaderboardEntry[]>([]);

  useEffect(() => {
    const prevEntries = prevEntriesRef.current;
    const newEntries = entries.slice(0, maxDisplay).map((entry) => {
      const prevIndex = prevEntries.findIndex((p) => p.id === entry.id);
      return {
        ...entry,
        previousRank: prevIndex >= 0 ? prevIndex + 1 : undefined,
      };
    });

    setAnimatedEntries(newEntries);
    prevEntriesRef.current = entries.slice(0, maxDisplay);
  }, [entries, maxDisplay]);

  const getRankChange = (currentRank: number, previousRank?: number) => {
    if (previousRank === undefined) return 'new';
    if (previousRank > currentRank) return 'up';
    if (previousRank < currentRank) return 'down';
    return 'same';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-white/60">{rank}</span>;
    }
  };

  const getRankChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'new':
        return <span className="text-xs text-yellow-400 font-bold">NEW</span>;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div
      className="rounded-2xl p-4 backdrop-blur-lg"
      style={{
        background: `linear-gradient(135deg, ${teamColor}20 0%, ${teamColor}10 100%)`,
        border: `2px solid ${teamColor}40`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5" style={{ color: teamColor }} />
        <h3 className="font-bold text-white text-lg">{title}</h3>
      </div>

      <div className="space-y-2">
        {animatedEntries.map((entry, index) => {
          const rank = index + 1;
          const rankChange = getRankChange(rank, entry.previousRank);
          const isCurrentPlayer = entry.id === currentPlayerId;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                isCurrentPlayer ? 'ring-2 ring-yellow-400' : ''
              }`}
              style={{
                background: isCurrentPlayer
                  ? `linear-gradient(135deg, ${teamColor}40 0%, ${teamColor}20 100%)`
                  : `${teamColor}15`,
                animation: rankChange === 'up' ? 'slideUp 0.5s ease-out' : 
                          rankChange === 'down' ? 'slideDown 0.5s ease-out' :
                          rankChange === 'new' ? 'fadeIn 0.5s ease-out' : 'none',
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                {getRankIcon(rank)}
              </div>

              <PlayerAvatar name={entry.playerName} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">
                  {entry.playerName}
                  {isCurrentPlayer && <span className="text-yellow-400 ml-1">(You)</span>}
                </div>
                <div className="text-xs text-white/60">
                  {entry.territoriesClaimed || 0} territories • {entry.correctAnswers || 0} correct
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 flex justify-center">
                  {getRankChangeIcon(rankChange)}
                </div>
                <div
                  className="text-xl font-bold min-w-[60px] text-right"
                  style={{ color: teamColor }}
                >
                  {entry.score}
                </div>
              </div>
            </div>
          );
        })}

        {animatedEntries.length === 0 && (
          <div className="text-center text-white/50 py-4">No players yet</div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0.5;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0.5;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
