import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionService } from '../../services/sessionService';
import { gameService, type LiveGame, type GamePlayer, type HexTerritory } from '../../services/gameService';
import { usePlayerStore } from '../../stores/playerStore';
import { Loading } from '../../components/shared/Loading';
import { Button } from '../../components/shared/Button';
import { ToastContainer } from '../../components/shared/Toast';
import { TeamIcon } from '../../components/shared/TeamIcon';
import { useToast } from '../../hooks/useToast';
import { useGameEffects } from '../../hooks/useGameEffects';
import { Confetti as SharedConfetti } from '../../components/shared/Confetti';
import { ScorePopup, ScoreStreak, Celebration, AchievementToast } from '../../components/game';
import { PlayerHexGrid } from '../../components/game/PlayerHexGrid';
import { Clock, Trophy, CheckCircle, XCircle, Users, Volume2, VolumeX, Target, Zap, MapPin, AlertCircle } from 'lucide-react';
import type { Session } from '../../types/session';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getTheme } from '../../constants/themes';
import { eandColors } from '../../constants/eandColors';

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
  const gameEffects = useGameEffects();
  const prevGameStatus = useRef<string>('lobby');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const hasStartedRedirectRef = useRef(false);

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

  // Background music control
  useEffect(() => {
    if (!session) return;

    const musicUrl = session.backgroundMusicUrl || '/assets/eandd.mp3';
    
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    const audio = audioRef.current;

    if (liveGame?.status === 'playing' && !isMuted) {
      audio.play().catch(() => {
        // Autoplay was prevented, user needs to interact first
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [liveGame?.status, isMuted, session]);

  // Update audio mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

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
    const newCount = questionsAnsweredCount + 1;
    setQuestionsAnsweredCount(newCount);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setAnswerResult(isCorrect ? 'correct' : 'incorrect');

    const points = session?.config.pointsPerCorrectAnswer || 10;
    if (isCorrect) {
      gameEffects.onCorrectAnswer(points, newCount === 1);
    } else {
      gameEffects.onIncorrectAnswer();
    }

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
      if (!isCorrect) {
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
      const isFirstTerritory = (playerData?.territoriesClaimed || 0) === 0;
      gameEffects.onTerritoryClaimed(isFirstTerritory);
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
        <div className="min-h-screen game-gradient-bg flex items-center justify-center">
          <div className="game-grid-bg absolute inset-0 opacity-20" />
          <Loading size="lg" />
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  if (!session || !liveGame) {
    return (
      <>
        <div className="min-h-screen game-gradient-bg flex items-center justify-center p-4">
          <div className="game-grid-bg absolute inset-0 opacity-20" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md relative z-10">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${eandColors.red}10` }}>
              <AlertCircle className="w-8 h-8" style={{ color: eandColors.red }} />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: eandColors.oceanBlue }}>Session Not Found</h1>
            <p className="text-sm mb-6" style={{ color: eandColors.grey }}>The session you're trying to join doesn't exist.</p>
            <Button onClick={() => navigate('/join')}>Back to Join</Button>
          </motion.div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  if (liveGame.status === 'lobby' && !team) {
    const team1Count = allPlayers.filter((p) => p.team === 'team1').length;
    const team2Count = allPlayers.filter((p) => p.team === 'team2').length;
    const team1Full = team1Count >= session.config.maxPlayersPerTeam;
    const team2Full = team2Count >= session.config.maxPlayersPerTeam;

    return (
      <div className="relative min-h-screen overflow-hidden p-4 game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-20" />

        <div className="max-w-lg mx-auto pt-6 sm:pt-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="text-center mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: `${eandColors.brightGreen}20`, border: `2px solid ${eandColors.brightGreen}40` }}>
                <Users className="w-7 h-7" style={{ color: eandColors.brightGreen }} />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-white mb-1">Welcome, {playerName}!</h1>
              <p className="text-sm text-white/60">Choose your team to join the battle</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'team1' as const, design: session.design.team1, count: team1Count, full: team1Full },
                { key: 'team2' as const, design: session.design.team2, count: team2Count, full: team2Full },
              ].map(({ key, design, count, full }, i) => (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  whileTap={full || isLoading ? undefined : { scale: 0.95 }}
                  whileHover={full || isLoading ? undefined : { scale: 1.03, y: -4 }}
                  onClick={() => handleTeamSelect(key)}
                  disabled={full || isLoading}
                  className="relative overflow-hidden rounded-2xl mobile-touch disabled:opacity-50 w-full"
                >
                  <div className="p-6 text-center" style={{
                    background: full ? `${eandColors.grey}20` : `linear-gradient(145deg, ${design.color}dd, ${design.color}99)`,
                    border: `3px solid ${full ? eandColors.grey + '40' : design.color}`,
                    minHeight: '220px',
                  }}>
                    <div className="flex justify-center mb-3">
                      <TeamIcon icon={design.icon} size="3xl" />
                    </div>
                    <h3 className="text-xl font-extrabold text-white mb-2 drop-shadow-lg">{design.name}</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white/90 text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                      <Users className="w-4 h-4" />
                      {count} / {session.config.maxPlayersPerTeam}
                    </div>
                    {full && (
                      <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="font-bold mt-3 text-sm px-4 py-1.5 rounded-full inline-block"
                        style={{ background: 'rgba(255,255,255,0.9)', color: eandColors.red }}>
                        Team Full
                      </motion.p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
                <Loading size="sm" />
                <p className="text-white/60 mt-2 text-sm font-medium">Joining team...</p>
              </motion.div>
            )}
          </motion.div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  if (liveGame.status === 'lobby' && team) {
    const teamColor = team === 'team1' ? session.design.team1.color : session.design.team2.color;
    const teamName = team === 'team1' ? session.design.team1.name : session.design.team2.name;
    const teamIcon = team === 'team1' ? session.design.team1.icon : session.design.team2.icon;

    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 game-gradient-bg">
        <div className="game-grid-bg absolute inset-0 opacity-20" />

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-10">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
            className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ backgroundColor: `${teamColor}15`, border: `3px solid ${teamColor}` }}>
            <TeamIcon icon={teamIcon} size="3xl" />
          </motion.div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: eandColors.oceanBlue }}>You're on {teamName}!</h1>
          <p className="text-sm mb-6" style={{ color: eandColors.grey }}>Waiting for the game to start...</p>

          <div className="rounded-xl p-5 mb-5" style={{ background: `${eandColors.oceanBlue}05`, border: `1px solid ${eandColors.oceanBlue}08` }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-5 h-5" style={{ color: eandColors.oceanBlue }} />
              <span className="text-lg font-bold" style={{ color: eandColors.oceanBlue }}>{allPlayers.length} Players Joined</span>
            </div>
            <p className="text-xs" style={{ color: eandColors.grey }}>The host will start the game soon</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 0.7, 0.4].map((opacity, i) => (
              <motion.div key={i} animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamColor, opacity }} />
            ))}
          </div>
        </motion.div>
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${eandColors.brightGreen}15` }}>
                <CheckCircle className="w-6 h-6" style={{ color: eandColors.brightGreen }} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold" style={{ color: eandColors.oceanBlue }}>Correct!</h2>
                <p className="text-xs" style={{ color: eandColors.grey }}>Tap a territory to claim it</p>
              </div>
            </div>
          </motion.div>

          <PlayerHexGrid
            gridSize={session.config.hexGridSize}
            territories={territories}
            team1Color={session.design.team1.color}
            team2Color={session.design.team2.color}
            backgroundVideoUrl={undefined}
            islandImageUrl={session.design.customBackgroundUrl || getTheme(session.design.backgroundTheme || 'win-together').backgroundImage}
            availableTerritories={availableTerritories}
            onHexClick={handleClaimTerritory}
            myTeam={team!}
            newlyClaimedHex={newlyClaimedHex}
          />

          <AnimatePresence>
            {claimingTerritory && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                <div className="px-6 py-3 rounded-full font-bold text-white shadow-2xl flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${eandColors.brightGreen}, ${eandColors.darkGreen})` }}>
                  <MapPin className="w-5 h-5 animate-pulse" />
                  <span>Territory Claimed!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      );
    }

    if (currentQuestion) {
      return (
        <div className="min-h-screen game-gradient-bg p-4">
          <div className="game-grid-bg absolute inset-0 opacity-10" />
          <div className="max-w-2xl mx-auto pt-3 relative z-10">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-3 mb-4 game-surface">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${eandColors.red}20` }}>
                  <Clock className="w-4 h-4" style={{ color: eandColors.red }} />
                  <span className="text-lg font-extrabold font-mono text-white">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span className="px-2 py-1 rounded-lg" style={{ background: `${teamColor}30` }}>You: {myScore}</span>
                  <span className="px-2 py-1 rounded-lg bg-white/10">Opp: {opponentScore}</span>
                </div>
              </div>
              {playerData && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Territories', value: playerData.territoriesClaimed, icon: MapPin },
                    { label: 'Answered', value: playerData.questionsAnswered, icon: Target },
                    { label: 'Correct', value: playerData.correctAnswers, icon: CheckCircle },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-lg py-1.5 bg-white/5">
                      <Icon className="w-3 h-3 mx-auto mb-0.5 text-white/50" />
                      <p className="text-white font-bold text-sm">{value}</p>
                      <p className="text-[10px] text-white/40">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {answerResult ? (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }} className="text-center py-4">
                    {answerResult === 'correct' ? (
                      <>
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
                          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                          style={{ background: `${eandColors.brightGreen}15` }}>
                          <CheckCircle className="w-10 h-10" style={{ color: eandColors.brightGreen }} />
                        </motion.div>
                        <h2 className="text-2xl font-extrabold mb-1" style={{ color: eandColors.brightGreen }}>Correct!</h2>
                        <p className="text-sm" style={{ color: eandColors.grey }}>Preparing territory selection...</p>
                      </>
                    ) : (
                      <>
                        <motion.div animate={{ x: [-4, 4, -4, 4, 0] }} transition={{ duration: 0.4 }}
                          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                          style={{ background: `${eandColors.red}10` }}>
                          <XCircle className="w-10 h-10" style={{ color: eandColors.red }} />
                        </motion.div>
                        <h2 className="text-2xl font-extrabold mb-1" style={{ color: eandColors.red }}>Incorrect</h2>
                        <p className="text-sm" style={{ color: eandColors.grey }}>Try the next question...</p>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="text-xl sm:text-2xl font-extrabold mb-5" style={{ color: eandColors.oceanBlue }}>
                      {currentQuestion.text}
                    </h2>

                    <div className="space-y-3 mb-5">
                      {currentQuestion.options?.map((option: any, idx: number) => (
                        <motion.button
                          key={option.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          whileTap={hasAnswered ? undefined : { scale: 0.98 }}
                          onClick={() => handleAnswerSelect(option.id)}
                          disabled={hasAnswered}
                          className="w-full p-4 rounded-xl text-left transition-all mobile-touch"
                          style={{
                            border: `2px solid ${selectedAnswer === option.id ? teamColor : eandColors.oceanBlue + '12'}`,
                            background: selectedAnswer === option.id ? `${teamColor}08` : 'transparent',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{
                                background: selectedAnswer === option.id ? teamColor : `${eandColors.oceanBlue}10`,
                                color: selectedAnswer === option.id ? 'white' : eandColors.oceanBlue,
                              }}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-medium" style={{ color: eandColors.oceanBlue }}>{option.text}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <Button onClick={handleSubmitAnswer} size="lg" className="w-full"
                      disabled={selectedAnswer === null || hasAnswered}
                      style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}cc)` }}>
                      <Zap className="w-5 h-5" /> Submit Answer
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      );
    }

    return (
      <>
        <div className="min-h-screen game-gradient-bg flex items-center justify-center p-4">
          <div className="game-grid-bg absolute inset-0 opacity-15" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${teamColor}20, ${teamColor}30)`, border: `3px solid ${teamColor}` }}
          >
            <Trophy className="w-10 h-10" style={{ color: teamColor }} />
          </motion.div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: eandColors.oceanBlue }}>Ready to Play!</h1>
          <p className="text-sm mb-5" style={{ color: eandColors.grey }}>Tap below to get a question</p>

          <div className="rounded-xl p-4 mb-5" style={{ background: `${eandColors.oceanBlue}05`, border: `1px solid ${eandColors.oceanBlue}08` }}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: eandColors.grey }}>Your Team</p>
                <p className="text-3xl font-extrabold" style={{ color: teamColor }}>{myScore}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: eandColors.grey }}>Opponent</p>
                <p className="text-3xl font-extrabold" style={{ color: eandColors.oceanBlue }}>{opponentScore}</p>
              </div>
            </div>
          </div>

          <Button onClick={getNewQuestion} size="lg" className="w-full" style={{ background: `linear-gradient(135deg, ${teamColor}, ${teamColor}cc)` }}>
            <Zap className="w-5 h-5" /> Get Question
          </Button>
        </motion.div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        
        {/* Gamification Effects */}
        {gameEffects.scorePopup.isVisible && (
          <ScorePopup
            points={gameEffects.scorePopup.points}
            isCorrect={gameEffects.scorePopup.isCorrect}
            onComplete={gameEffects.hideScorePopup}
          />
        )}
        <ScoreStreak streak={gameEffects.streak} />
        <Celebration
          type={gameEffects.confettiType}
          isActive={gameEffects.showConfetti}
          onComplete={gameEffects.hideConfetti}
        />
        <AchievementToast
          achievements={gameEffects.pendingAchievements}
          onDismiss={gameEffects.dismissAchievement}
        />
        
        {/* Sound Toggle */}
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            gameEffects.setMuted(!isMuted);
          }}
          className="fixed bottom-4 right-4 z-40 p-3 rounded-full bg-white/90 shadow-lg hover:scale-110 transition-transform"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-gray-600" /> : <Volume2 className="w-5 h-5 text-gray-600" />}
        </button>
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

    if (session.postGameFileUrl && !hasStartedRedirectRef.current) {
      hasStartedRedirectRef.current = true;
      setRedirectCountdown(3);
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            window.open(session.postGameFileUrl, '_blank');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    const teamColor = team === 'team1' ? session.design.team1.color : session.design.team2.color;

    return (
      <>
        <SharedConfetti active={showConfetti} duration={5000} />
        <div className="min-h-screen game-gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
          <div className="game-grid-bg absolute inset-0 opacity-20" />

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center relative z-10">

            {tied ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: `${eandColors.oceanBlue}10` }}>
                <Users className="w-10 h-10" style={{ color: eandColors.oceanBlue }} />
              </motion.div>
            ) : won ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center game-glow-green"
                style={{ background: `${eandColors.brightGreen}15`, border: `2px solid ${eandColors.brightGreen}40` }}>
                <Trophy className="w-10 h-10" style={{ color: eandColors.brightGreen }} />
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: `${eandColors.grey}10` }}>
                <Target className="w-10 h-10" style={{ color: eandColors.grey }} />
              </motion.div>
            )}

            <h1 className="text-2xl font-extrabold mb-1" style={{ color: eandColors.oceanBlue }}>Game Over!</h1>

            {tied ? (
              <p className="text-lg font-bold mb-4" style={{ color: eandColors.oceanBlue }}>It's a Tie!</p>
            ) : won ? (
              <>
                <p className="text-lg font-extrabold mb-1" style={{ color: teamColor }}>Victory!</p>
                <p className="text-sm mb-4" style={{ color: eandColors.grey }}>Your team conquered the island!</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold mb-1" style={{ color: eandColors.grey }}>Good Try!</p>
                <p className="text-sm mb-4" style={{ color: eandColors.grey }}>Better luck next time!</p>
              </>
            )}

            {redirectCountdown !== null ? (
              <div className="mb-4 px-4 py-2.5 rounded-xl" style={{ background: `${eandColors.brightGreen}08`, border: `1px solid ${eandColors.brightGreen}20` }}>
                <p className="text-sm font-medium" style={{ color: eandColors.brightGreen }}>Opening document in {redirectCountdown}...</p>
              </div>
            ) : session.postGameFileUrl ? (
              <div className="mb-4 px-4 py-2.5 rounded-xl" style={{ background: `${eandColors.brightGreen}08`, border: `1px solid ${eandColors.brightGreen}20` }}>
                <p className="text-sm font-medium" style={{ color: eandColors.brightGreen }}>Document opened in new tab</p>
              </div>
            ) : (
              <div className="mb-4 px-4 py-2.5 rounded-xl" style={{ background: `${eandColors.oceanBlue}05`, border: `1px solid ${eandColors.oceanBlue}10` }}>
                <p className="text-sm font-medium" style={{ color: eandColors.oceanBlue }}>Waiting for host to restart...</p>
              </div>
            )}

            <div className="rounded-xl p-4 mb-4" style={{ background: `${eandColors.oceanBlue}04`, border: `1px solid ${eandColors.oceanBlue}08` }}>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: eandColors.grey }}>Your Team</p>
                  <p className="text-3xl font-extrabold" style={{ color: teamColor }}>{myScore}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: eandColors.grey }}>Opponent</p>
                  <p className="text-3xl font-extrabold" style={{ color: eandColors.oceanBlue }}>{opponentScore}</p>
                </div>
              </div>
            </div>

            {playerData && (
              <div className="rounded-xl p-4" style={{ background: `${eandColors.oceanBlue}04`, border: `1px solid ${eandColors.oceanBlue}08` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: eandColors.oceanBlue }}>Your Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Territories', value: playerData.territoriesClaimed, icon: MapPin },
                    { label: 'Answered', value: playerData.questionsAnswered, icon: Target },
                    { label: 'Correct', value: playerData.correctAnswers, icon: CheckCircle },
                    { label: 'Accuracy', value: `${playerData.questionsAnswered > 0 ? Math.round((playerData.correctAnswers / playerData.questionsAnswered) * 100) : 0}%`, icon: Zap },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: `${eandColors.oceanBlue}04` }}>
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: eandColors.grey }} />
                      <div className="text-left">
                        <p className="text-xs" style={{ color: eandColors.grey }}>{label}</p>
                        <p className="text-sm font-bold" style={{ color: eandColors.oceanBlue }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
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
