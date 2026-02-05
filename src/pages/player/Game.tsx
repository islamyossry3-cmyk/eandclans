import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { sessionService } from '../../services/sessionService';
import { gameService, type LiveGame, type GamePlayer, type HexTerritory } from '../../services/gameService';
import { usePlayerStore } from '../../stores/playerStore';
import { Loading } from '../../components/shared/Loading';
import { Button } from '../../components/shared/Button';
import { ToastContainer } from '../../components/shared/Toast';
import { TeamIcon } from '../../components/shared/TeamIcon';
import { useToast } from '../../hooks/useToast';
import { Confetti } from '../../components/shared/Confetti';
import { PlayerHexGrid } from '../../components/game/PlayerHexGrid';
import { Clock, Trophy, Target, CheckCircle, XCircle, Users } from 'lucide-react';
import type { Session } from '../../types/session';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getTheme } from '../../constants/themes';

export function PlayerGamePage() {
  const { sessionPin } = useParams<{ sessionPin: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerName = searchParams.get('name');
  const playerEmail = searchParams.get('email');
  const playerOrganization = searchParams.get('organization');

  const customFields: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (!['name', 'email', 'organization'].includes(key)) {
      customFields[key] = value;
    }
  });

  const { playerId, team, setPlayer, setPlayerData, playerData } = usePlayerStore();
  const { toasts, removeToast, success, info, error: showError } = useToast();
  const prevGameStatus = useRef<string>('lobby');

  const [session, setSession] = useState<Session | null>(null);
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [allPlayers, setAllPlayers] = useState<GamePlayer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | null>(null);
  const [availableTerritories, setAvailableTerritories] = useState<string[]>([]);
  const [claimingTerritory, setClaimingTerritory] = useState(false);
  const [territories, setTerritories] = useState<HexTerritory[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyClaimedHex, setNewlyClaimedHex] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName) {
      navigate(`/join?pin=${sessionPin || ''}`);
      return;
    }
    loadSession();
  }, [sessionPin, playerName]);

  useEffect(() => {
    if (!liveGame) return;

    const channels: RealtimeChannel[] = [];

    const gameChannel = gameService.subscribeToGame(
      liveGame.id,
      (updatedGame) => {
        if (updatedGame.status === 'playing' && prevGameStatus.current === 'lobby') {
          success('Game started! Good luck!');
        } else if (updatedGame.status === 'ended' && prevGameStatus.current === 'playing') {
          info('Game ended!');
        } else if (updatedGame.status === 'lobby' && prevGameStatus.current === 'ended') {
          localStorage.removeItem('playerId');
          localStorage.removeItem('playerName');
          localStorage.removeItem('gameId');
          localStorage.removeItem('team');
          usePlayerStore.getState().clearPlayer();
          setCurrentQuestion(null);
          setHasAnswered(false);
          setSelectedAnswer(null);
          setAvailableTerritories([]);
          info('Session restarted! Select a team to join.');
        }
        prevGameStatus.current = updatedGame.status;
        setLiveGame(updatedGame);
      },
      () => {
        localStorage.removeItem('playerId');
        localStorage.removeItem('playerName');
        localStorage.removeItem('gameId');
        localStorage.removeItem('team');
        info('Session restarted. Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    );
    channels.push(gameChannel);

    const playersChannel = gameService.subscribeToPlayers(liveGame.id, (updatedPlayers) => {
      setAllPlayers(updatedPlayers);
      if (playerId) {
        const player = updatedPlayers.find((p) => p.id === playerId);
        if (player) {
          setPlayerData(player);
        } else {
          localStorage.removeItem('playerId');
          localStorage.removeItem('playerName');
          localStorage.removeItem('gameId');
          localStorage.removeItem('team');
          usePlayerStore.getState().clearPlayer();
          setCurrentQuestion(null);
          setHasAnswered(false);
          setSelectedAnswer(null);
          setAvailableTerritories([]);
        }
      }
    });
    channels.push(playersChannel);

    const territoriesChannel = gameService.subscribeToTerritories(liveGame.id, (updatedTerritories) => {
      setTerritories(updatedTerritories);
    });
    channels.push(territoriesChannel);

    return () => {
      channels.forEach((channel) => channel.unsubscribe());
    };
  }, [liveGame?.id, playerId]);

  useEffect(() => {
    if (!playerId || !liveGame) return;

    const updateConnection = () => {
      gameService.updatePlayerConnection(playerId, true);
    };

    updateConnection();
    const heartbeat = setInterval(updateConnection, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      gameService.updatePlayerConnection(playerId, false);
    };
  }, [playerId, liveGame?.id]);

  useEffect(() => {
    if (liveGame?.status === 'playing' && liveGame.endsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(liveGame.endsAt!).getTime() - Date.now()) / 1000));
        setTimeRemaining(remaining);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [liveGame?.status, liveGame?.endsAt]);

  const loadSession = async () => {
    setIsLoading(true);

    const foundSession = await sessionService.getSessionByPin(sessionPin!);

    if (!foundSession) {
      setIsLoading(false);
      return;
    }

    setSession(foundSession);

    let game = await gameService.getLiveGameBySessionId(foundSession.id);
    if (!game) {
      game = await gameService.createLiveGame(foundSession.id);
    }

    if (game) {
      setLiveGame(game);
      const gamePlayers = await gameService.getPlayers(game.id);
      setAllPlayers(gamePlayers);

      const gameTerritories = await gameService.getTerritories(game.id);
      setTerritories(gameTerritories);

      const existingPlayer = gamePlayers.find((p) => p.playerName === playerName);
      if (existingPlayer && existingPlayer.team) {
        setPlayer(existingPlayer.id, playerName!, game.id, existingPlayer.team);
        setPlayerData(existingPlayer);
      }
    }

    setIsLoading(false);
  };

  const handleTeamSelect = async (selectedTeam: 'team1' | 'team2') => {
    if (!liveGame || !session || isLoading) {
      console.log('[Game] handleTeamSelect blocked:', { liveGame: !!liveGame, session: !!session, isLoading });
      return;
    }

    console.log('[Game] handleTeamSelect called for team:', selectedTeam);

    const existingPlayer = allPlayers.find((p) => p.playerName === playerName);
    if (existingPlayer) {
      console.log('[Game] Player already exists, reconnecting:', existingPlayer.id);
      setPlayer(existingPlayer.id, playerName!, liveGame.id, existingPlayer.team!);
      setPlayerData(existingPlayer);
      return;
    }

    const teamPlayers = allPlayers.filter((p) => p.team === selectedTeam);
    if (teamPlayers.length >= session.config.maxPlayersPerTeam) {
      showError('Team is full!');
      return;
    }

    setIsLoading(true);
    setSelectedTeam(selectedTeam);

    console.log('[Game] Adding player to game:', liveGame.id);
    const player = await gameService.addPlayer(liveGame.id, playerName!, selectedTeam, {
      email: playerEmail || undefined,
      organization: playerOrganization || undefined,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    });

    if (player) {
      console.log('[Game] Player added successfully:', player.id);
      setPlayer(player.id, playerName!, liveGame.id, selectedTeam);
      setPlayerData(player);
      const teamName = selectedTeam === 'team1' ? session.design.team1.name : session.design.team2.name;
      success(`Joined ${teamName}!`);
    } else {
      console.error('[Game] Failed to add player - gameService.addPlayer returned null');
      showError('Failed to join team. Please try again.');
      setSelectedTeam(null);
    }

    setIsLoading(false);
  };

  const handleAnswerSelect = (answerId: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || hasAnswered || !currentQuestion || !playerId || !liveGame) return;

    setHasAnswered(true);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setAnswerResult(isCorrect ? 'correct' : 'incorrect');

    await gameService.updatePlayerStats(playerId, {
      questionsAnswered: 1,
      correctAnswers: isCorrect ? 1 : 0,
    });

    if (isCorrect && team && liveGame) {
      const territories = await gameService.getTerritories(liveGame.id);
      const occupied = territories.map((t) => t.hexId);

      const allHexIds = [
        ...['hex-1-1', 'hex-1-2', 'hex-1-3', 'hex-1-4', 'hex-1-5', 'hex-1-6'],
        ...['hex-2-1', 'hex-2-2', 'hex-2-3', 'hex-2-4', 'hex-2-5', 'hex-2-6', 'hex-2-7', 'hex-2-8', 'hex-2-9', 'hex-2-10', 'hex-2-11', 'hex-2-12'],
        ...['hex-3-1', 'hex-3-2', 'hex-3-3', 'hex-3-4', 'hex-3-5', 'hex-3-6', 'hex-3-7', 'hex-3-8', 'hex-3-9', 'hex-3-10', 'hex-3-11', 'hex-3-12', 'hex-3-13', 'hex-3-14', 'hex-3-15', 'hex-3-16', 'hex-3-17', 'hex-3-18']
      ];

      const gridSize = session?.config.hexGridSize || 18;
      let available: string[] = [];

      if (gridSize <= 6) {
        available = allHexIds.slice(0, 6);
      } else if (gridSize <= 18) {
        available = allHexIds.slice(0, 18);
      } else {
        available = allHexIds;
      }

      available = available.filter((hexId) => !occupied.includes(hexId));
      setAvailableTerritories(available);
    }

    setTimeout(() => {
      if (isCorrect) {
      } else {
        setHasAnswered(false);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setCurrentQuestion(null);
      }
    }, 2000);
  };

  const handleClaimTerritory = async (hexId: string) => {
    if (!liveGame || !playerId || !team || claimingTerritory) return;

    setClaimingTerritory(true);
    setNewlyClaimedHex(hexId);

    const claimSuccess = await gameService.claimTerritory(liveGame.id, hexId, team, playerId);

    if (claimSuccess) {
      success('Territory claimed!');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setAvailableTerritories([]);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setCurrentQuestion(null);
      setNewlyClaimedHex(null);
    } else {
      showError('Failed to claim territory');
      setNewlyClaimedHex(null);
    }

    setClaimingTerritory(false);
  };

  const getNewQuestion = () => {
    if (!session) return;

    const questions = session.questions || [];
    if (questions.length === 0) {
      showError('No questions available');
      return;
    }

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setAnswerResult(null);
    setAvailableTerritories([]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
          <Loading />
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  if (!session || !liveGame) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
            <p className="text-gray-600 mb-6">The session you're trying to join doesn't exist.</p>
            <Button onClick={() => navigate('/join')}>Back to Join</Button>
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  if (liveGame.status === 'lobby' && !team) {
    const theme = getTheme(session.design.backgroundTheme || 'innovation');
    const islandImage = theme.backgroundImage;
    const team1Count = allPlayers.filter((p) => p.team === 'team1').length;
    const team2Count = allPlayers.filter((p) => p.team === 'team2').length;
    const team1Full = team1Count >= session.config.maxPlayersPerTeam;
    const team2Full = team2Count >= session.config.maxPlayersPerTeam;

    return (
      <div className="relative min-h-screen overflow-hidden p-4">
        {/* Blurred Background */}
        {islandImage && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${islandImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(30px) brightness(0.8)',
              transform: 'scale(1.1)',
              zIndex: -20,
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: theme.gradients.player,
            opacity: 0.9,
            zIndex: -10,
          }}
        />

        <div className="max-w-3xl mx-auto pt-8 relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 md:p-8 mb-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Welcome, {playerName}!
              </h1>
              <p className="text-gray-600">Choose your team to join the battle</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Team 1 Flag */}
              <button
                onClick={() => handleTeamSelect('team1')}
                disabled={team1Full || isLoading}
                className="relative overflow-hidden touch-manipulation disabled:opacity-50"
                style={{
                  clipPath: !team1Full ? 'polygon(0 0, 100% 0, 100% calc(100% - 40px), 50% 100%, 0 calc(100% - 40px))' : 'none',
                }}
              >
                <div
                  className={`p-6 backdrop-blur-sm transition-all ${
                    team1Full || isLoading
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                  style={{
                    background: team1Full ? undefined : `linear-gradient(135deg, ${session.design.team1.color}CC 0%, ${session.design.team1.color}AA 100%)`,
                    border: `4px solid ${session.design.team1.color}`,
                    minHeight: '280px',
                  }}
                >
                  <div className="flex justify-center mb-4">
                    <TeamIcon icon={session.design.team1.icon} size="3xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
                    {session.design.team1.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-white text-lg">
                    <Users className="w-5 h-5" />
                    <span className="font-bold">
                      {team1Count} / {session.config.maxPlayersPerTeam}
                    </span>
                  </div>
                  {team1Full && (
                    <p className="text-red-600 font-bold mt-3 bg-white/90 rounded-2xl py-1 px-3">Team Full</p>
                  )}
                </div>
              </button>

              {/* Team 2 Flag */}
              <button
                onClick={() => handleTeamSelect('team2')}
                disabled={team2Full || isLoading}
                className="relative overflow-hidden touch-manipulation disabled:opacity-50"
                style={{
                  clipPath: !team2Full ? 'polygon(0 0, 100% 0, 100% calc(100% - 40px), 50% 100%, 0 calc(100% - 40px))' : 'none',
                }}
              >
                <div
                  className={`p-6 backdrop-blur-sm transition-all ${
                    team2Full || isLoading
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                  style={{
                    background: team2Full ? undefined : `linear-gradient(135deg, ${session.design.team2.color}CC 0%, ${session.design.team2.color}AA 100%)`,
                    border: `4px solid ${session.design.team2.color}`,
                    minHeight: '280px',
                  }}
                >
                  <div className="flex justify-center mb-4">
                    <TeamIcon icon={session.design.team2.icon} size="3xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
                    {session.design.team2.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-white text-lg">
                    <Users className="w-5 h-5" />
                    <span className="font-bold">
                      {team2Count} / {session.config.maxPlayersPerTeam}
                    </span>
                  </div>
                  {team2Full && (
                    <p className="text-red-600 font-bold mt-3 bg-white/90 rounded-2xl py-1 px-3">Team Full</p>
                  )}
                </div>
              </button>
            </div>

            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="text-gray-600 mt-2 font-semibold">Joining team...</p>
              </div>
            )}
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  if (liveGame.status === 'lobby' && team) {
    const theme = getTheme(session.design.backgroundTheme || 'innovation');
    const islandImage = theme.backgroundImage;
    const teamColor = team === 'team1' ? session.design.team1.color : session.design.team2.color;
    const teamName = team === 'team1' ? session.design.team1.name : session.design.team2.name;
    const teamIcon = team === 'team1' ? session.design.team1.icon : session.design.team2.icon;

    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
        {/* Blurred Background */}
        {islandImage && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${islandImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(30px) brightness(0.8)',
              transform: 'scale(1.1)',
              zIndex: -20,
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: theme.gradients.player,
            opacity: 0.9,
            zIndex: -10,
          }}
        />

        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 max-w-md w-full text-center relative z-10">
          <div
            className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${teamColor}30`, border: `4px solid ${teamColor}` }}
          >
            <TeamIcon icon={teamIcon} size="3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You're on {teamName}!</h1>
          <p className="text-gray-600 mb-8">Waiting for the game to start...</p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
              <Users className="w-6 h-6" />
              <span className="font-bold text-lg">{allPlayers.length} Players Joined</span>
            </div>
            <p className="text-sm text-gray-600">The host will start the game soon</p>
          </div>

          <div className="animate-pulse flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }}></div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor, opacity: 0.7 }}></div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor, opacity: 0.4 }}></div>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  if (liveGame.status === 'playing') {
    const teamColor = team === 'team1' ? session.design.team1.color : session.design.team2.color;
    const opponentTeam = team === 'team1' ? 'team2' : 'team1';
    const myScore = team === 'team1' ? liveGame.team1Score : liveGame.team2Score;
    const opponentScore = team === 'team1' ? liveGame.team2Score : liveGame.team1Score;

    if (availableTerritories.length > 0) {
      return (
        <div className="relative min-h-screen">
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl px-8 py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Correct!</h2>
                  <p className="text-sm text-gray-600">Tap a territory to claim it</p>
                </div>
              </div>
            </div>
          </div>

          <PlayerHexGrid
            gridSize={session.config.hexGridSize}
            territories={territories}
            team1Color={session.design.team1.color}
            team2Color={session.design.team2.color}
            backgroundVideoUrl={undefined}
            islandImageUrl={getTheme(session.design.backgroundTheme || 'innovation').backgroundImage}
            availableTerritories={availableTerritories}
            onHexClick={handleClaimTerritory}
            myTeam={team!}
            newlyClaimedHex={newlyClaimedHex}
          />

          {claimingTerritory && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl flex items-center gap-3">
                <CheckCircle className="w-6 h-6 animate-pulse" />
                <span>Territory Claimed!</span>
              </div>
            </div>
          )}

          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      );
    }

    if (currentQuestion) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4">
          <div className="max-w-2xl mx-auto pt-4">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 mb-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-bold font-mono">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>Your Team: {myScore}</span>
                  <span>Opponent: {opponentScore}</span>
                </div>
              </div>
              {playerData && (
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <p className="opacity-75">Territories</p>
                    <p className="text-lg font-bold">{playerData.territoriesClaimed}</p>
                  </div>
                  <div>
                    <p className="opacity-75">Answered</p>
                    <p className="text-lg font-bold">{playerData.questionsAnswered}</p>
                  </div>
                  <div>
                    <p className="opacity-75">Correct</p>
                    <p className="text-lg font-bold">{playerData.correctAnswers}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl p-8">
              {answerResult ? (
                <div className="text-center">
                  {answerResult === 'correct' ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-green-600 mb-2">Correct!</h2>
                      <p className="text-gray-600">Preparing territory selection...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                        <XCircle className="w-12 h-12 text-red-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-red-600 mb-2">Incorrect</h2>
                      <p className="text-gray-600">Try the next question...</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {currentQuestion.text}
                  </h2>

                  <div className="space-y-3 mb-6">
                    {currentQuestion.options?.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        disabled={hasAnswered}
                        className={`w-full p-4 rounded-3xl border-2 text-left transition-all ${
                          selectedAnswer === option.id
                            ? 'border-current bg-current bg-opacity-10'
                            : 'border-gray-300 hover:border-gray-400'
                        } ${hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                          borderColor: selectedAnswer === option.id ? teamColor : undefined,
                          backgroundColor: selectedAnswer === option.id ? `${teamColor}10` : undefined,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: selectedAnswer === option.id ? teamColor : '#d1d5db' }}
                          >
                            {option.id}
                          </span>
                          <span className="font-medium text-gray-900">{option.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubmitAnswer}
                    size="lg"
                    className="w-full"
                    disabled={selectedAnswer === null || hasAnswered}
                    style={{ backgroundColor: teamColor }}
                  >
                    Submit Answer
                  </Button>
                </>
              )}
            </div>
          </div>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      );
    }

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full text-center">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${teamColor}30`, border: `4px solid ${teamColor}` }}
          >
            <Trophy className="w-12 h-12" style={{ color: teamColor }} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Ready to Play!</h1>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Score</p>
                <p className="text-3xl font-bold" style={{ color: teamColor }}>
                  {myScore}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Opponent</p>
                <p className="text-3xl font-bold text-gray-900">{opponentScore}</p>
              </div>
            </div>
          </div>

          <Button onClick={getNewQuestion} size="lg" className="w-full" style={{ backgroundColor: teamColor }}>
            Get Question
          </Button>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
      </>
    );
  }

  if (liveGame.status === 'ended') {
    const myScore = team === 'team1' ? liveGame.team1Score : liveGame.team2Score;
    const opponentScore = team === 'team1' ? liveGame.team2Score : liveGame.team1Score;
    const won = myScore > opponentScore;
    const tied = myScore === opponentScore;

    if (won && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    const teamColor = team === 'team1' ? session.design.team1.color : session.design.team2.color;

    return (
      <>
        <Confetti active={showConfetti} duration={5000} />
        <div
          className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
          style={{
            background: won
              ? `linear-gradient(135deg, ${teamColor}20, ${teamColor}40, ${teamColor}60)`
              : 'linear-gradient(135deg, #94a3b8, #64748b)',
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {won && (
              <>
                <div className="absolute top-10 left-10 text-6xl animate-bounce">🎉</div>
                <div className="absolute top-20 right-20 text-5xl animate-bounce delay-100">🏆</div>
                <div className="absolute bottom-20 left-20 text-5xl animate-bounce delay-200">✨</div>
                <div className="absolute bottom-10 right-10 text-6xl animate-bounce delay-300">🎊</div>
              </>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center relative z-10">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-pulse">Game Over!</h1>
            <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-3xl p-4">
              <p className="text-blue-800 font-medium">Waiting for host to restart...</p>
            </div>

            {tied ? (
              <>
                <div className="text-8xl mb-6 animate-bounce">🤝</div>
                <h2 className="text-4xl font-bold text-gray-700 mb-6">It's a Tie!</h2>
              </>
            ) : won ? (
              <>
                <div className="text-8xl mb-6 animate-bounce">🏆</div>
                <h2 className="text-4xl font-bold mb-6" style={{ color: teamColor }}>
                  Victory!
                </h2>
                <p className="text-xl text-gray-600 mb-6">Your team conquered the island!</p>
              </>
            ) : (
              <>
                <div className="text-8xl mb-6">💪</div>
                <h2 className="text-4xl font-bold text-gray-600 mb-6">Good Try!</h2>
                <p className="text-xl text-gray-600 mb-6">Better luck next time!</p>
              </>
            )}

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Your Team</p>
                  <p className="text-4xl font-bold text-gray-900">{myScore}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Opponent</p>
                  <p className="text-4xl font-bold text-gray-900">{opponentScore}</p>
                </div>
              </div>
            </div>

            {playerData && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-700 mb-3">Your Stats</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Territories Claimed:</span>
                    <span className="font-bold">{playerData.territoriesClaimed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions Answered:</span>
                    <span className="font-bold">{playerData.questionsAnswered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correct Answers:</span>
                    <span className="font-bold">{playerData.correctAnswers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-bold">
                      {playerData.questionsAnswered > 0
                        ? Math.round((playerData.correctAnswers / playerData.questionsAnswered) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      </>
    );
  }

  return (
    <>
      {null}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
