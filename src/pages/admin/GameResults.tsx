import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameService, type LiveGame, type GamePlayer, type HexTerritory } from '../../services/gameService';
import { sessionService } from '../../services/sessionService';
import { Loading } from '../../components/shared/Loading';
import { Button } from '../../components/shared/Button';
import { Trophy, Target, CheckCircle, Users, Clock, ArrowLeft, Download } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';
import type { Session } from '../../types/session';

export function GameResultsPage() {
  const { sessionPin } = useParams<{ sessionPin: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [territories, setTerritories] = useState<HexTerritory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionPin) {
      loadGameResults();
    }
  }, [sessionPin]);

  const loadGameResults = async () => {
    setIsLoading(true);
    try {
      const sessionData = await sessionService.getSessionByPin(sessionPin!);
      if (!sessionData) {
        setIsLoading(false);
        return;
      }
      setSession(sessionData);

      const game = await gameService.getGameBySessionId(sessionData.id);
      if (game) {
        setLiveGame(game);
        const gamePlayers = await gameService.getPlayers(game.id);
        setPlayers(gamePlayers);
        const gameTerritories = await gameService.getTerritories(game.id);
        setTerritories(gameTerritories);
      }
    } catch (error) {
      console.error('Error loading game results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportResults = () => {
    if (!session || !liveGame || players.length === 0) return;

    const team1Players = players.filter((p) => p.team === 'team1');
    const team2Players = players.filter((p) => p.team === 'team2');

    const csvContent = [
      ['Trivia Titans Game Results'],
      ['Session', session.name],
      ['Date', new Date(liveGame.createdAt).toLocaleString()],
      ['Duration', `${Math.round((new Date(liveGame.endsAt!).getTime() - new Date(liveGame.startedAt!).getTime()) / 60000)} minutes`],
      [],
      ['Final Score'],
      [`${session.design.team1.name}`, liveGame.team1Score],
      [`${session.design.team2.name}`, liveGame.team2Score],
      [],
      [`${session.design.team1.name} Players`],
      ['Player Name', 'Territories Claimed', 'Questions Answered', 'Correct Answers', 'Accuracy'],
      ...team1Players.map((p) => [
        p.playerName,
        p.territoriesClaimed,
        p.questionsAnswered,
        p.correctAnswers,
        `${p.questionsAnswered > 0 ? Math.round((p.correctAnswers / p.questionsAnswered) * 100) : 0}%`,
      ]),
      [],
      [`${session.design.team2.name} Players`],
      ['Player Name', 'Territories Claimed', 'Questions Answered', 'Correct Answers', 'Accuracy'],
      ...team2Players.map((p) => [
        p.playerName,
        p.territoriesClaimed,
        p.questionsAnswered,
        p.correctAnswers,
        `${p.questionsAnswered > 0 ? Math.round((p.correctAnswers / p.questionsAnswered) * 100) : 0}%`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `care-clans-${session.sessionPin}-results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <Loading />
      </div>
    );
  }

  if (!session || !liveGame) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4" style={{ color: eandColors.oceanBlue }}>Game Not Found</h1>
          <p className="mb-6" style={{ color: eandColors.grey }}>No game results available for this session.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const team1Players = players
    .filter((p) => p.team === 'team1')
    .sort((a, b) => b.territoriesClaimed - a.territoriesClaimed);

  const team2Players = players
    .filter((p) => p.team === 'team2')
    .sort((a, b) => b.territoriesClaimed - a.territoriesClaimed);

  const winner =
    liveGame.team1Score > liveGame.team2Score
      ? session.design.team1.name
      : liveGame.team2Score > liveGame.team1Score
      ? session.design.team2.name
      : 'Tie';

  const totalQuestions = players.reduce((sum, p) => sum + p.questionsAnswered, 0);
  const totalCorrect = players.reduce((sum, p) => sum + p.correctAnswers, 0);
  const duration = Math.round(
    (new Date(liveGame.endsAt!).getTime() - new Date(liveGame.startedAt!).getTime()) / 60000
  );

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: eandColors.lightGrey }}>
      <div className="bg-white shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <Button onClick={exportResults} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Results
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: eandColors.oceanBlue }}>{session.name}</h1>
            <p style={{ color: eandColors.grey }}>Game Results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: `${eandColors.red}10` }}>
              <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: eandColors.red }} />
              <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Winner</p>
              <p className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{winner}</p>
            </div>
            <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: `${eandColors.brightGreen}15` }}>
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: eandColors.brightGreen }} />
              <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Total Players</p>
              <p className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{players.length}</p>
            </div>
            <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: `${eandColors.oceanBlue}10` }}>
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: eandColors.oceanBlue }} />
              <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Questions Answered</p>
              <p className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{totalQuestions}</p>
            </div>
            <div className="rounded-3xl p-6 text-center" style={{ backgroundColor: `${eandColors.sandRed}20` }}>
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: eandColors.sandRed }} />
              <p className="text-sm mb-1" style={{ color: eandColors.grey }}>Duration</p>
              <p className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{duration} min</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div
              className="rounded-3xl p-6 border-4"
              style={{
                backgroundColor: `${session.design.team1.color}10`,
                borderColor: session.design.team1.color,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{session.design.team1.icon}</span>
                  <h2 className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{session.design.team1.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold" style={{ color: eandColors.oceanBlue }}>{liveGame.team1Score}</p>
                  <p className="text-sm" style={{ color: eandColors.grey }}>territories</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-3xl p-6 border-4"
              style={{
                backgroundColor: `${session.design.team2.color}10`,
                borderColor: session.design.team2.color,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{session.design.team2.icon}</span>
                  <h2 className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{session.design.team2.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold" style={{ color: eandColors.oceanBlue }}>{liveGame.team2Score}</p>
                  <p className="text-sm" style={{ color: eandColors.grey }}>territories</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2rem] shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{session.design.team1.icon}</span>
              <h2 className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{session.design.team1.name} Players</h2>
            </div>
            <div className="space-y-3">
              {team1Players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ backgroundColor: `${session.design.team1.color}10` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: session.design.team1.color }}
                  >
                    {index === 0 ? <Trophy className="w-5 h-5" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: eandColors.oceanBlue }}>{player.playerName}</h3>
                    <div className="flex items-center gap-4 text-sm mt-1" style={{ color: eandColors.grey }}>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{player.territoriesClaimed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          {player.correctAnswers}/{player.questionsAnswered} (
                          {player.questionsAnswered > 0
                            ? Math.round((player.correctAnswers / player.questionsAnswered) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {team1Players.length === 0 && (
                <p className="text-center py-8" style={{ color: eandColors.grey }}>No players</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{session.design.team2.icon}</span>
              <h2 className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>{session.design.team2.name} Players</h2>
            </div>
            <div className="space-y-3">
              {team2Players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ backgroundColor: `${session.design.team2.color}10` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: session.design.team2.color }}
                  >
                    {index === 0 ? <Trophy className="w-5 h-5" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: eandColors.oceanBlue }}>{player.playerName}</h3>
                    <div className="flex items-center gap-4 text-sm mt-1" style={{ color: eandColors.grey }}>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{player.territoriesClaimed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          {player.correctAnswers}/{player.questionsAnswered} (
                          {player.questionsAnswered > 0
                            ? Math.round((player.correctAnswers / player.questionsAnswered) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {team2Players.length === 0 && (
                <p className="text-center py-8" style={{ color: eandColors.grey }}>No players</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
