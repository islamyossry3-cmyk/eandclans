import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService, type Tournament, type TournamentSession, type TournamentPlayer } from '../../services/tournamentService';
import { gameService, type LiveGame, type GamePlayer, type HexTerritory } from '../../services/gameService';
import { useTournamentStore } from '../../stores/tournamentStore';
import { useTournamentScheduler } from '../../hooks/useTournamentScheduler';
import { Loading } from '../../components/shared/Loading';
import { Button } from '../../components/shared/Button';
import { ToastContainer } from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';
import { useGameEffects } from '../../hooks/useGameEffects';
import { ScorePopup, ScoreStreak, Celebration, AchievementToast } from '../../components/game';
import { PlayerHexGrid } from '../../components/game/PlayerHexGrid';
import { eandColors } from '../../constants/eandColors';
import { 
  Clock, Trophy, CheckCircle, XCircle, Users, Award,
  Zap, Target, Play, Pause, Calendar, Volume2, VolumeX
} from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface QuestionOption {
  id: string;
  text: string;
  textAr?: string;
}

interface Question {
  id: string;
  text: string;
  textAr?: string;
  options: QuestionOption[];
  correctAnswer: string;
}

export function TournamentPlayPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { 
    currentTournament, currentPlayer, currentSession,
    setCurrentTournament, setCurrentSession, addCredit
  } = useTournamentStore();

  const { toasts, removeToast, success, error: showError } = useToast();
  const gameEffects = useGameEffects();
  const [isMuted, setIsMuted] = useState(false);

  const [tournament, setTournament] = useState<Tournament | null>(currentTournament);
  const [session, setSession] = useState<TournamentSession | null>(currentSession);
  const [player, setPlayer] = useState<TournamentPlayer | null>(currentPlayer);
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [gamePlayer, setGamePlayer] = useState<GamePlayer | null>(null);
  const [allPlayers, setAllPlayers] = useState<GamePlayer[]>([]);
  const [territories, setTerritories] = useState<HexTerritory[]>([]);
  const [leaderboard, setLeaderboard] = useState<TournamentPlayer[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<'correct' | 'incorrect' | null>(null);
  const [availableTerritories, setAvailableTerritories] = useState<string[]>([]);
  const [claimingTerritory, setClaimingTerritory] = useState(false);
  const [team, setTeam] = useState<'team1' | 'team2' | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [allSessions, setAllSessions] = useState<TournamentSession[]>([]);

  useEffect(() => {
    if (!tournamentId) {
      navigate('/join');
      return;
    }

    if (!currentPlayer) {
      navigate(`/tournament/${tournamentId}/join`);
      return;
    }

    loadTournamentData();
  }, [tournamentId, currentPlayer]);

  // Auto session scheduler (player-side)
  useTournamentScheduler({
    tournament,
    sessions: allSessions,
    onSessionsChanged: useCallback(() => {
      if (tournamentId) {
        tournamentService.getTournamentSessions(tournamentId).then(setAllSessions);
      }
    }, [tournamentId]),
    enabled: !!tournament && tournament.status === 'active',
  });

  useEffect(() => {
    if (!tournament) return;

    const channels: RealtimeChannel[] = [];

    const tournamentChannel = tournamentService.subscribeToTournament(
      tournament.id,
      (updated) => {
        setTournament(updated);
        setCurrentTournament(updated);
      }
    );
    channels.push(tournamentChannel);

    const sessionsChannel = tournamentService.subscribeToTournamentSessions(
      tournament.id,
      async (sessions) => {
        const activeSession = sessions.find(s => s.status === 'active');
        if (activeSession && activeSession.id !== session?.id) {
          setSession(activeSession);
          setCurrentSession(activeSession);
          await loadSessionGame(activeSession);
        } else if (!activeSession) {
          setSession(null);
          setCurrentSession(null);
          setLiveGame(null);
        }
      }
    );
    channels.push(sessionsChannel);

    const playersChannel = tournamentService.subscribeToTournamentPlayers(
      tournament.id,
      (players) => {
        setLeaderboard(players.sort((a, b) => b.totalCredits - a.totalCredits).slice(0, 10));
        const me = players.find(p => p.id === player?.id);
        if (me) setPlayer(me);
      }
    );
    channels.push(playersChannel);

    return () => {
      channels.forEach(ch => ch.unsubscribe());
    };
  }, [tournament?.id]);

  useEffect(() => {
    if (!liveGame) return;

    const channels: RealtimeChannel[] = [];

    const gameChannel = gameService.subscribeToGame(
      liveGame.id,
      (updated) => setLiveGame(updated),
      () => {}
    );
    channels.push(gameChannel);

    const playersChannel = gameService.subscribeToPlayers(liveGame.id, (players) => {
      setAllPlayers(players);
      if (gamePlayer) {
        const me = players.find(p => p.id === gamePlayer.id);
        if (me) setGamePlayer(me);
      }
    });
    channels.push(playersChannel);

    const territoriesChannel = gameService.subscribeToTerritories(liveGame.id, setTerritories);
    channels.push(territoriesChannel);

    return () => {
      channels.forEach(ch => ch.unsubscribe());
    };
  }, [liveGame?.id, gamePlayer?.id]);

  useEffect(() => {
    if (session?.status === 'active' && session.scheduledEnd) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(session.scheduledEnd).getTime() - Date.now()) / 1000));
        setTimeRemaining(remaining);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session?.status, session?.scheduledEnd]);

  const loadTournamentData = async () => {
    setIsLoading(true);

    const [tournamentData, sessionsData, playersData] = await Promise.all([
      tournamentService.getTournament(tournamentId!),
      tournamentService.getTournamentSessions(tournamentId!),
      tournamentService.getTournamentPlayers(tournamentId!),
    ]);

    if (!tournamentData) {
      showError('Tournament not found');
      navigate('/join');
      return;
    }

    setTournament(tournamentData);
    setCurrentTournament(tournamentData);
    setLeaderboard(playersData.sort((a, b) => b.totalCredits - a.totalCredits).slice(0, 10));
    setAllSessions(sessionsData);

    // Load questions from tournament
    loadQuestions(tournamentData);

    // Find active session
    const activeSession = sessionsData.find(s => s.status === 'active');
    if (activeSession) {
      setSession(activeSession);
      setCurrentSession(activeSession);
      await loadSessionGame(activeSession);
    }

    setIsLoading(false);
  };

  const loadQuestions = (tournamentData: Tournament) => {
    // Load questions directly from the tournament's questions field
    if (tournamentData.questions && tournamentData.questions.length > 0) {
      const mapped: Question[] = tournamentData.questions.map(q => ({
        id: q.id,
        text: q.text,
        textAr: q.textAr,
        options: q.options.map(o => ({ id: o.id, text: o.text, textAr: o.textAr })),
        correctAnswer: q.correctAnswer,
      }));
      // Shuffle questions for each player
      const shuffled = [...mapped].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
    } else {
      setQuestions([]);
    }
  };

  // Helper: get display text based on player's preferred language
  const isArabic = player?.preferredLanguage === 'ar';
  const getQuestionText = (q: Question) => (isArabic && q.textAr) ? q.textAr : q.text;
  const getOptionText = (o: QuestionOption) => (isArabic && o.textAr) ? o.textAr : o.text;

  const loadSessionGame = async (sessionData: TournamentSession) => {
    if (!sessionData.liveGameId) return;

    const game = await gameService.getLiveGame(sessionData.liveGameId);
    if (game) {
      setLiveGame(game);
      const gamePlayers = await gameService.getPlayers(game.id);
      setAllPlayers(gamePlayers);
      const gameTerritories = await gameService.getTerritories(game.id);
      setTerritories(gameTerritories);

      // Check if player already joined this game session
      const existingPlayer = gamePlayers.find(p => p.playerName === player?.playerName);
      if (existingPlayer) {
        setGamePlayer(existingPlayer);
        setTeam(existingPlayer.team);
      }
    }
  };

  const handleTeamSelect = async (selectedTeam: 'team1' | 'team2') => {
    if (!liveGame || !player) return;

    const existingPlayer = allPlayers.find(p => p.playerName === player.playerName);
    if (existingPlayer) {
      setGamePlayer(existingPlayer);
      setTeam(existingPlayer.team);
      return;
    }

    const teamPlayers = allPlayers.filter(p => p.team === selectedTeam);
    const maxPerTeam = tournament?.maxPlayersPerTeam || 25;
    if (teamPlayers.length >= maxPerTeam) {
      showError('Team is full!');
      return;
    }

    const newPlayer = await gameService.addPlayer(liveGame.id, player.playerName, selectedTeam);
    if (newPlayer) {
      setGamePlayer(newPlayer);
      setTeam(selectedTeam);
      const teamName = selectedTeam === 'team1'
        ? (tournament?.design?.team1?.name || 'Team 1')
        : (tournament?.design?.team2?.name || 'Team 2');
      success(`Joined ${teamName}!`);
    } else {
      showError('Failed to join team');
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || hasAnswered || !currentQuestion || !player || !gamePlayer || !liveGame) return;

    setHasAnswered(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setAnswerResult(isCorrect ? 'correct' : 'incorrect');

    // Trigger gamification effects
    if (isCorrect) {
      gameEffects.onCorrectAnswer(10, player.totalCorrectAnswers === 0);
    } else {
      gameEffects.onIncorrectAnswer();
    }

    // Update game player stats
    await gameService.updatePlayerStats(gamePlayer.id, {
      questionsAnswered: 1,
      correctAnswers: isCorrect ? 1 : 0,
    });

    if (isCorrect) {
      // Update team score in live game
      const pointsPerAnswer = tournament?.design?.pointsPerCorrectAnswer || 10;
      if (team) {
        await gameService.updateScore(liveGame.id, team, pointsPerAnswer);
      }

      // Update tournament player stats and check for credit
      const result = await tournamentService.addCorrectAnswer(player.id);
      if (result.creditEarned) {
        addCredit();
        gameEffects.unlockAchievement('streak_3');
        success('🎉 You earned a credit!');
      }

      // Get available territories
      const currentTerritories = await gameService.getTerritories(liveGame.id);
      const occupied = currentTerritories.map(t => t.hexId);
      const allHexIds = [
        'hex-1-1', 'hex-1-2', 'hex-1-3', 'hex-1-4', 'hex-1-5', 'hex-1-6',
        'hex-2-1', 'hex-2-2', 'hex-2-3', 'hex-2-4', 'hex-2-5', 'hex-2-6',
        'hex-2-7', 'hex-2-8', 'hex-2-9', 'hex-2-10', 'hex-2-11', 'hex-2-12',
      ];
      const available = allHexIds.filter(id => !occupied.includes(id));
      setAvailableTerritories(available);
    } else {
      setTimeout(() => {
        setHasAnswered(false);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setCurrentQuestion(null);
      }, 2000);
    }
  };

  const handleClaimTerritory = async (hexId: string) => {
    if (!liveGame || !gamePlayer || !team || claimingTerritory) return;

    setClaimingTerritory(true);
    const claimSuccess = await gameService.claimTerritory(liveGame.id, hexId, team, gamePlayer.id);

    if (claimSuccess) {
      const isFirstTerritory = player?.totalTerritoriesClaimed === 0;
      gameEffects.onTerritoryClaimed(isFirstTerritory);
      success('Territory claimed!');
      
      // Update tournament player stats
      if (player) {
        await tournamentService.updatePlayerStats(player.id, {
          territoriesClaimedToAdd: 1,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setAvailableTerritories([]);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setCurrentQuestion(null);
    } else {
      showError('Failed to claim territory');
    }

    setClaimingTerritory(false);
  };

  const getNewQuestion = () => {
    if (questions.length === 0) {
      showError('No questions available');
      return;
    }

    // Get unanswered questions first, then allow repeats if all answered
    const unanswered = questions.filter(q => !answeredQuestionIds.has(q.id));
    const pool = unanswered.length > 0 ? unanswered : questions;
    const randomQuestion = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(randomQuestion);
    setAnsweredQuestionIds(prev => new Set(prev).add(randomQuestion.id));
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <Loading />
      </div>
    );
  }

  if (!tournament || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: eandColors.grey }} />
          <h1 className="text-2xl font-bold mb-4" style={{ color: eandColors.oceanBlue }}>
            Session Error
          </h1>
          <p className="mb-6" style={{ color: eandColors.grey }}>
            Please rejoin the tournament.
          </p>
          <Button onClick={() => navigate(`/tournament/${tournamentId}/join`)}>
            Rejoin Tournament
          </Button>
        </div>
      </div>
    );
  }

  // Tournament is not active or no active session
  if (tournament.status !== 'active' || !session) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="max-w-lg mx-auto pt-8">
          {/* Tournament Header */}
          <div
            className="rounded-t-3xl p-6 text-center"
            style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.red} 100%)` }}
          >
            <Trophy className="w-12 h-12 mx-auto mb-3 text-white" />
            <h1 className="text-xl font-bold text-white">{tournament.name}</h1>
            <p className="text-white/80 text-sm mt-1">
              {tournament.status === 'scheduled' ? 'Tournament starting soon' : 
               tournament.status === 'paused' ? 'Tournament paused' : 
               tournament.status === 'completed' ? 'Tournament ended' : 'Waiting for next session'}
            </p>
          </div>

          {/* Player Stats Card */}
          <div className="bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm" style={{ color: eandColors.grey }}>Welcome back</p>
                <p className="text-lg font-bold" style={{ color: eandColors.oceanBlue }}>{player.playerName}</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: `${eandColors.brightGreen}20` }}>
                <Zap className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
                <span className="font-bold" style={{ color: eandColors.brightGreen }}>{player.totalCredits} Credits</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
                <Target className="w-5 h-5 mx-auto mb-1" style={{ color: eandColors.oceanBlue }} />
                <p className="text-xs" style={{ color: eandColors.grey }}>Correct</p>
                <p className="font-bold" style={{ color: eandColors.oceanBlue }}>{player.totalCorrectAnswers}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
                <Award className="w-5 h-5 mx-auto mb-1" style={{ color: eandColors.red }} />
                <p className="text-xs" style={{ color: eandColors.grey }}>Territories</p>
                <p className="font-bold" style={{ color: eandColors.red }}>{player.totalTerritoriesClaimed}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: eandColors.lightGrey }}>
                <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: eandColors.mauve }} />
                <p className="text-xs" style={{ color: eandColors.grey }}>Sessions</p>
                <p className="font-bold" style={{ color: eandColors.mauve }}>{player.sessionsPlayed}</p>
              </div>
            </div>
          </div>

          {/* Waiting Message */}
          <div className="bg-white p-6 rounded-b-3xl shadow-lg border-t" style={{ borderColor: eandColors.lightGrey }}>
            <div className="text-center">
              {tournament.status === 'scheduled' ? (
                <>
                  <div className="animate-pulse mb-4">
                    <Play className="w-12 h-12 mx-auto" style={{ color: eandColors.brightGreen }} />
                  </div>
                  <p className="font-semibold" style={{ color: eandColors.oceanBlue }}>Tournament Starting Soon</p>
                  <p className="text-sm mt-2" style={{ color: eandColors.grey }}>
                    Stay on this page - the game will begin automatically
                  </p>
                </>
              ) : tournament.status === 'paused' ? (
                <>
                  <Pause className="w-12 h-12 mx-auto mb-4" style={{ color: eandColors.sandRed }} />
                  <p className="font-semibold" style={{ color: eandColors.oceanBlue }}>Tournament Paused</p>
                  <p className="text-sm mt-2" style={{ color: eandColors.grey }}>
                    The tournament will resume shortly
                  </p>
                </>
              ) : tournament.status === 'completed' ? (
                <>
                  <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: '#FFD700' }} />
                  <p className="font-semibold" style={{ color: eandColors.oceanBlue }}>Tournament Complete!</p>
                  <p className="text-sm mt-2" style={{ color: eandColors.grey }}>
                    Check with the organizer for final results
                  </p>
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: eandColors.oceanBlue, animationDuration: '3s' }} />
                  <p className="font-semibold" style={{ color: eandColors.oceanBlue }}>Waiting for Next Session</p>
                  <p className="text-sm mt-2" style={{ color: eandColors.grey }}>
                    Break time! Next session starts automatically
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Leaderboard Preview */}
          {leaderboard.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                <h3 className="font-bold" style={{ color: eandColors.oceanBlue }}>Leaderboard</h3>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((p, index) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-xl ${p.id === player.id ? 'ring-2' : ''}`}
                    style={{ 
                      backgroundColor: index < 3 ? `${eandColors.brightGreen}10` : eandColors.lightGrey,
                      outline: `2px solid ${eandColors.oceanBlue}`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : eandColors.mediumGrey,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium" style={{ color: eandColors.oceanBlue }}>
                        {p.playerName} {p.id === player.id && '(You)'}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: eandColors.brightGreen }}>
                      {p.totalCredits} ⚡
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Active session - Team selection
  if (session && liveGame && !team) {
    const team1Count = allPlayers.filter(p => p.team === 'team1').length;
    const team2Count = allPlayers.filter(p => p.team === 'team2').length;
    const maxPerTeam = tournament.maxPlayersPerTeam || 25;

    return (
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold" style={{ color: eandColors.oceanBlue }}>
                Session #{session.sessionNumber}
              </h1>
              <p style={{ color: eandColors.grey }}>Choose your team to join</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Clock className="w-4 h-4" style={{ color: eandColors.brightGreen }} />
                <span className="font-mono font-bold" style={{ color: eandColors.brightGreen }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const t1Color = tournament?.design?.team1?.color || eandColors.red;
                const t2Color = tournament?.design?.team2?.color || eandColors.oceanBlue;
                const t1Name = tournament?.design?.team1?.name || 'Team 1';
                const t2Name = tournament?.design?.team2?.name || 'Team 2';
                const t1Icon = tournament?.design?.team1?.icon || '🔴';
                const t2Icon = tournament?.design?.team2?.icon || '🔵';
                return (
                  <>
                    <button
                      onClick={() => handleTeamSelect('team1')}
                      disabled={team1Count >= maxPerTeam}
                      className="p-6 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      style={{ backgroundColor: `${t1Color}20`, border: `3px solid ${t1Color}` }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">{t1Icon}</div>
                        <h3 className="font-bold text-lg" style={{ color: t1Color }}>{t1Name}</h3>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Users className="w-4 h-4" style={{ color: eandColors.grey }} />
                          <span style={{ color: eandColors.grey }}>{team1Count}/{maxPerTeam}</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTeamSelect('team2')}
                      disabled={team2Count >= maxPerTeam}
                      className="p-6 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      style={{ backgroundColor: `${t2Color}20`, border: `3px solid ${t2Color}` }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">{t2Icon}</div>
                        <h3 className="font-bold text-lg" style={{ color: t2Color }}>{t2Name}</h3>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Users className="w-4 h-4" style={{ color: eandColors.grey }} />
                          <span style={{ color: eandColors.grey }}>{team2Count}/{maxPerTeam}</span>
                        </div>
                      </div>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Credits Display */}
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span style={{ color: eandColors.grey }}>Your Credits</span>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
                <span className="font-bold text-xl" style={{ color: eandColors.brightGreen }}>{player.totalCredits}</span>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Active session - Playing
  if (session && liveGame && team) {
    const t1Color = tournament?.design?.team1?.color || eandColors.red;
    const t2Color = tournament?.design?.team2?.color || eandColors.oceanBlue;
    const t1Name = tournament?.design?.team1?.name || 'Team 1';
    const t2Name = tournament?.design?.team2?.name || 'Team 2';
    const teamColor = team === 'team1' ? t1Color : t2Color;
    const myTeamName = team === 'team1' ? t1Name : t2Name;
    const opponentTeamName = team === 'team1' ? t2Name : t1Name;
    const myScore = team === 'team1' ? liveGame.team1Score : liveGame.team2Score;
    const opponentScore = team === 'team1' ? liveGame.team2Score : liveGame.team1Score;

    // Territory claiming view
    if (availableTerritories.length > 0) {
      return (
        <div className="relative min-h-screen">
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-6 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" style={{ color: eandColors.brightGreen }} />
                <div>
                  <h2 className="font-bold" style={{ color: eandColors.oceanBlue }}>Correct!</h2>
                  <p className="text-sm" style={{ color: eandColors.grey }}>Tap a territory to claim</p>
                </div>
              </div>
            </div>
          </div>

          <PlayerHexGrid
            gridSize={tournament?.design?.hexGridSize || 18}
            territories={territories}
            team1Color={t1Color}
            team2Color={t2Color}
            backgroundVideoUrl={undefined}
            islandImageUrl={undefined}
            availableTerritories={availableTerritories}
            onHexClick={handleClaimTerritory}
            myTeam={team}
            newlyClaimedHex={null}
          />

          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      );
    }

    // Question view
    if (currentQuestion) {
      return (
        <div className="min-h-screen p-4" style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.red} 100%)` }}>
          <div className="max-w-2xl mx-auto pt-4">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-bold font-mono">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{myTeamName}: {myScore}</span>
                  <span>{opponentTeamName}: {opponentScore}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Session #{session.sessionNumber}</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>{player.totalCredits} credits</span>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {answerResult ? (
                <div className="text-center py-8">
                  {answerResult === 'correct' ? (
                    <>
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${eandColors.brightGreen}20` }}>
                        <CheckCircle className="w-12 h-12" style={{ color: eandColors.brightGreen }} />
                      </div>
                      <h2 className="text-2xl font-bold mb-2" style={{ color: eandColors.brightGreen }}>Correct!</h2>
                      <p style={{ color: eandColors.grey }}>Select a territory...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${eandColors.red}20` }}>
                        <XCircle className="w-12 h-12" style={{ color: eandColors.red }} />
                      </div>
                      <h2 className="text-2xl font-bold mb-2" style={{ color: eandColors.red }}>Incorrect</h2>
                      <p style={{ color: eandColors.grey }}>Try the next question...</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <h2 className={`text-xl font-bold mb-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'} style={{ color: eandColors.oceanBlue }}>
                    {getQuestionText(currentQuestion)}
                  </h2>

                  <div className="space-y-3 mb-6">
                    {currentQuestion.options?.map((option: QuestionOption) => (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        disabled={hasAnswered}
                        className="w-full p-4 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: selectedAnswer === option.id ? teamColor : eandColors.mediumGrey,
                          backgroundColor: selectedAnswer === option.id ? `${teamColor}10` : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: selectedAnswer === option.id ? teamColor : eandColors.mediumGrey }}
                          >
                            {option.id}
                          </span>
                          <span className="font-medium" dir={isArabic ? 'rtl' : 'ltr'} style={{ color: eandColors.oceanBlue }}>{getOptionText(option)}</span>
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

    // Ready to play view
    return (
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.red} 100%)` }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${teamColor}20`, border: `4px solid ${teamColor}` }}
          >
            <Trophy className="w-12 h-12" style={{ color: teamColor }} />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: eandColors.oceanBlue }}>
            Session #{session.sessionNumber}
          </h1>
          <p className="mb-6" style={{ color: eandColors.grey }}>You're on {myTeamName}</p>

          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: eandColors.lightGrey }}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm" style={{ color: eandColors.grey }}>Your Team</p>
                <p className="text-3xl font-bold" style={{ color: teamColor }}>{myScore}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: eandColors.grey }}>Opponent</p>
                <p className="text-3xl font-bold" style={{ color: eandColors.grey }}>{opponentScore}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Clock className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
            <span className="font-mono text-xl font-bold" style={{ color: eandColors.brightGreen }}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          <Button
            onClick={getNewQuestion}
            size="lg"
            className="w-full"
            style={{ backgroundColor: teamColor }}
          >
            Get Question
          </Button>

          {/* Credits info */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: eandColors.lightGrey }}>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
              <span className="font-bold" style={{ color: eandColors.brightGreen }}>{player.totalCredits} Credits</span>
            </div>
            <p className="text-xs mt-1" style={{ color: eandColors.grey }}>
              3 correct answers = 1 credit
            </p>
          </div>
        </div>
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
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
      <Loading />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
