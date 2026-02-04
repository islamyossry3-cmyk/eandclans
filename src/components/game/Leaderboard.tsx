import { Trophy, Target, CheckCircle } from 'lucide-react';
import type { GamePlayer } from '../../services/gameService';
import { TeamIcon } from '../shared/TeamIcon';

interface LeaderboardProps {
  players: GamePlayer[];
  team1Name: string;
  team2Name: string;
  team1Color: string;
  team2Color: string;
  team1Icon: string;
  team2Icon: string;
}

export function Leaderboard({
  players,
  team1Name,
  team2Name,
  team1Color,
  team2Color,
  team1Icon,
  team2Icon,
}: LeaderboardProps) {
  const team1Players = players
    .filter((p) => p.team === 'team1')
    .sort((a, b) => b.territoriesClaimed - a.territoriesClaimed);

  const team2Players = players
    .filter((p) => p.team === 'team2')
    .sort((a, b) => b.territoriesClaimed - a.territoriesClaimed);

  const PlayerRow = ({ player, rank }: { player: GamePlayer; rank: number }) => {
    const teamColor = player.team === 'team1' ? team1Color : team2Color;
    const teamIcon = player.team === 'team1' ? team1Icon : team2Icon;

    return (
      <div
        className="flex items-center gap-4 p-4 rounded-2xl backdrop-blur-md"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: teamColor }}
        >
          {rank === 1 ? <Trophy className="w-6 h-6" /> : rank}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TeamIcon icon={teamIcon} size="sm" />
            <h3 className="text-lg font-bold text-white">{player.playerName}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-cyan-200 mt-1">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>{player.territoriesClaimed}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>{player.correctAnswers}/{player.questionsAnswered}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{player.territoriesClaimed}</p>
          <p className="text-xs text-cyan-200">territories</p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        className="rounded-[2rem] p-6 border-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: team1Color }}
      >
        <div className="flex items-center gap-3 mb-6">
          <TeamIcon icon={team1Icon} size="lg" />
          <h2 className="text-2xl font-bold text-white">{team1Name}</h2>
        </div>
        <div className="space-y-3">
          {team1Players.map((player, index) => (
            <PlayerRow key={player.id} player={player} rank={index + 1} />
          ))}
          {team1Players.length === 0 && (
            <p className="text-center text-cyan-200 py-8">No players yet</p>
          )}
        </div>
      </div>

      <div
        className="rounded-[2rem] p-6 border-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: team2Color }}
      >
        <div className="flex items-center gap-3 mb-6">
          <TeamIcon icon={team2Icon} size="lg" />
          <h2 className="text-2xl font-bold text-white">{team2Name}</h2>
        </div>
        <div className="space-y-3">
          {team2Players.map((player, index) => (
            <PlayerRow key={player.id} player={player} rank={index + 1} />
          ))}
          {team2Players.length === 0 && (
            <p className="text-center text-cyan-200 py-8">No players yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
