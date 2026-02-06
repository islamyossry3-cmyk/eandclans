import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { sessionService } from '../../services/sessionService';
import { gameService, type LiveGame, type GamePlayer, type HexTerritory } from '../../services/gameService';
import { Loading } from '../../components/shared/Loading';
import { QRCode } from '../../components/shared/QRCode';
import { Button } from '../../components/shared/Button';
import { Leaderboard } from '../../components/game/Leaderboard';
import { HexGrid } from '../../components/game/HexGrid';
import { ToastContainer } from '../../components/shared/Toast';
import { TeamIcon } from '../../components/shared/TeamIcon';
import { Confetti } from '../../components/shared/Confetti';
import { useToast } from '../../hooks/useToast';
import { Play, Users, Grid3x3, Trophy, Copy, Check, Wifi, WifiOff } from 'lucide-react';
import type { Session } from '../../types/session';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getTheme } from '../../constants/themes';

export function LiveSessionPage() {
  const { sessionPin } = useParams<{ sessionPin: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [liveGame, setLiveGame] = useState<LiveGame | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [territories, setTerritories] = useState<HexTerritory[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [restartCountdown, setRestartCountdown] = useState<number | null>(null);
  const { toasts, removeToast, success, info } = useToast();
  const prevTerritoryCount = useRef(0);

  useEffect(() => {
    if (sessionPin) {
      loadSession();
    }
  }, [sessionPin]);

  useEffect(() => {
    if (!liveGame || !session) return;

    const channels: RealtimeChannel[] = [];
    let subscribedCount = 0;
    const totalChannels = 4;

    const markSubscribed = () => {
      subscribedCount++;
      if (subscribedCount >= totalChannels) {
        setRealtimeConnected(true);
      }
    };

    const sessionChannel = sessionService.subscribeToSession(session.id, (updatedSession) => {
      setSession(updatedSession);
      info('Session updated by admin');
    });
    channels.push(sessionChannel);

    const gameChannel = gameService.subscribeToGame(
      liveGame.id,
      (updatedGame) => {
        if (updatedGame.status === 'playing' && liveGame.status === 'lobby') {
          info('Game has started!');
        } else if (updatedGame.status === 'ended' && liveGame.status === 'playing') {
          success('Game ended!');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
        setLiveGame(updatedGame);
      },
      () => {
        info('Session restarted. Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      // onReady: refetch game state to catch any changes during subscription gap
      async () => {
        markSubscribed();
        const freshGame = await gameService.getLiveGame(liveGame.id);
        if (freshGame) setLiveGame(freshGame);
      }
    );
    channels.push(gameChannel);

    const playersChannel = gameService.subscribeToPlayerUpdates(
      liveGame.id,
      {
        onInsert: (newPlayer) => {
          setPlayers(prev => {
            if (prev.some(p => p.id === newPlayer.id)) return prev;
            return [...prev, newPlayer];
          });
          info(`${newPlayer.playerName} joined the game`);
        },
        onUpdate: (updatedPlayer) => {
          setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
        },
        onDelete: (deletedId) => {
          setPlayers(prev => prev.filter(p => p.id !== deletedId));
        }
      },
      // onReady: refetch all players to catch any joins during subscription gap
      async () => {
        markSubscribed();
        const freshPlayers = await gameService.getPlayers(liveGame.id);
        setPlayers(freshPlayers);
      }
    );
    channels.push(playersChannel);

    const territoriesChannel = gameService.subscribeToTerritories(liveGame.id, (updatedTerritories) => {
      if (prevTerritoryCount.current > 0 && updatedTerritories.length > prevTerritoryCount.current) {
        const newTerritory = updatedTerritories[updatedTerritories.length - 1];
        const teamName = session?.design[newTerritory.owner]?.name || newTerritory.owner;
        success(`${teamName} claimed a territory!`);
      }
      prevTerritoryCount.current = updatedTerritories.length;
      setTerritories(updatedTerritories);
    });
    channels.push(territoriesChannel);

    // Lightweight polling fallback: catch any missed realtime events
    const pollInterval = setInterval(async () => {
      const [freshGame, freshPlayers] = await Promise.all([
        gameService.getLiveGame(liveGame.id),
        gameService.getPlayers(liveGame.id),
      ]);
      if (freshGame) setLiveGame(freshGame);
      setPlayers(freshPlayers);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      channels.forEach((channel) => channel.unsubscribe());
      setRealtimeConnected(false);
    };
  }, [liveGame?.id]);

  useEffect(() => {
    if (liveGame?.status === 'playing' && liveGame.endsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(liveGame.endsAt!).getTime() - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining === 0) {
          gameService.endGame(liveGame.id);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [liveGame?.status, liveGame?.endsAt]);

  useEffect(() => {
    if (liveGame?.status === 'ended' && session?.autoRestart && restartCountdown === null) {
      setRestartCountdown(session.restartDelay || 60);
      
      const interval = setInterval(() => {
        setRestartCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            handleRestartSession();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (liveGame?.status !== 'ended') {
      setRestartCountdown(null);
    }
  }, [liveGame?.status, session?.autoRestart, session?.restartDelay]);

  const loadSession = async () => {
    setIsLoading(true);

    let foundSession = await sessionService.getSessionByPin(sessionPin!);

    if (!foundSession) {
      setIsLoading(false);
      return;
    }

    setSession(foundSession);

    // Auto-transition session to 'live' when admin opens the live page
    if (foundSession.status === 'draft' || foundSession.status === 'ready') {
      await sessionService.updateSession(foundSession.id, { status: 'live' } as Partial<Session>);
      foundSession = { ...foundSession, status: 'live' };
      setSession(foundSession);
    }

    let game = await gameService.getLiveGameBySessionId(foundSession.id);
    if (!game) {
      game = await gameService.createLiveGame(foundSession.id);
    }

    if (game) {
      setLiveGame(game);
      const gamePlayers = await gameService.getPlayers(game.id);
      const gameTerritories = await gameService.getTerritories(game.id);
      setPlayers(gamePlayers);
      setTerritories(gameTerritories);
    }

    setIsLoading(false);
  };

  const handleStartGame = async () => {
    if (liveGame && session) {
      await gameService.startGame(liveGame.id, session.config.duration);
    }
  };

  const handleEndGame = async () => {
    if (liveGame) {
      await gameService.endGame(liveGame.id);
    }
  };

  const handleRestartSession = async () => {
    if (!liveGame) return;

    setIsLoading(true);
    const success = await gameService.resetGame(liveGame.id);

    if (success) {
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } else {
      setIsLoading(false);
    }
  };

  const copyGameLink = async () => {
    const gameLink = `${window.location.origin}/individual/${session?.sessionPin}`;
    try {
      await navigator.clipboard.writeText(gameLink);
      setLinkCopied(true);
      success('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      info('Failed to copy link');
    }
  };

  const getTeamPlayers = (team: 'team1' | 'team2') => {
    return players.filter((p) => p.team === team);
  };


  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 flex items-center justify-center">
          <Loading />
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  if (!session || !liveGame) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
            <p className="text-gray-600">The session PIN you entered is invalid.</p>
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  if (liveGame.status === 'lobby') {
    const theme = getTheme(session.design.backgroundTheme || 'win-together');
    const islandImage = session.design.customBackgroundUrl || theme.backgroundImage;

    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Full-screen island map background */}
        {islandImage && (
          <img
            src={islandImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        )}
        {/* Dark overlay for contrast */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.55) 100%)`,
            zIndex: 1,
          }}
        />

        {/* UI content on top */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-3 py-4">
          {/* Title — compact */}
          <div className="text-center mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{session.name}</h1>
            {session.design.brandingText && (
              <p className="text-sm md:text-base text-white/80 drop-shadow-md">{session.design.brandingText}</p>
            )}
          </div>

          {session.type === 'team_battle' ? (
          <div className="grid grid-cols-3 gap-3 md:gap-5 w-full max-w-5xl items-start">
            {/* Team 1 Flag Card — compact */}
            <div
              className="relative"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 40px), 50% 100%, 0 calc(100% - 40px))',
              }}
            >
              <div
                className="h-full p-3 md:p-5 backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${session.design.team1.color}95 0%, ${session.design.team1.color}75 100%)`,
                  border: `3px solid ${session.design.team1.color}`,
                  minHeight: '280px',
                }}
              >
                <div className="text-center mb-3">
                  <div className="flex justify-center mb-3">
                    <TeamIcon icon={session.design.team1.icon} size="2xl" />
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-white mb-1 drop-shadow-lg">
                    {session.design.team1.name}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-white text-sm">
                    <Users className="w-4 h-4" />
                    <span className="font-bold">
                      {getTeamPlayers('team1').length} / {session.config.maxPlayersPerTeam}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {getTeamPlayers('team1').map((player) => (
                    <div key={player.id} className="bg-white/30 backdrop-blur-sm rounded-xl px-3 py-2 text-white text-sm font-semibold">
                      {player.playerName}
                    </div>
                  ))}
                  {getTeamPlayers('team1').length === 0 && (
                    <p className="text-center text-white/70 py-4 text-sm">Waiting for players...</p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Center Card — compact */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 shadow-2xl">
              <div className="text-center mb-3">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-0.5">Join the Battle</h3>
                <p className="text-xs text-gray-500">Scan QR Code or enter PIN</p>
              </div>

              <div className="flex justify-center mb-3">
                <div className="bg-white p-2 rounded-2xl shadow-md">
                  <QRCode
                    value={`${window.location.origin}/join?pin=${session.sessionPin}`}
                    size={130}
                  />
                </div>
              </div>

              <div
                className="rounded-2xl p-3 text-center mb-3 shadow-md"
                style={{ background: theme.gradients.player }}
              >
                <p className="text-white text-[10px] font-semibold mb-1 opacity-90">SESSION PIN</p>
                <p className="text-white text-2xl md:text-3xl font-bold tracking-wider font-mono drop-shadow-lg">
                  {session.sessionPin}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-gray-700 mb-2 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-bold">{players.length} Players Joined</span>
              </div>

              {/* Realtime Connection Status */}
              <div className="flex items-center justify-center gap-1.5 mb-3 text-xs">
                {realtimeConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600 font-medium">Live updates active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                    <span className="text-yellow-600 font-medium">Connecting...</span>
                  </>
                )}
              </div>

              {players.length >= 2 && (
                <Button
                  onClick={handleStartGame}
                  size="lg"
                  className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 shadow-lg text-sm py-2"
                >
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              )}
              {players.length < 2 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-center">
                  <p className="text-yellow-800 font-semibold text-xs">Need at least 2 players to start</p>
                </div>
              )}
            </div>

            {/* Team 2 Flag Card — compact */}
            <div
              className="relative"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 40px), 50% 100%, 0 calc(100% - 40px))',
              }}
            >
              <div
                className="h-full p-3 md:p-5 backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${session.design.team2.color}95 0%, ${session.design.team2.color}75 100%)`,
                  border: `3px solid ${session.design.team2.color}`,
                  minHeight: '280px',
                }}
              >
                <div className="text-center mb-3">
                  <div className="flex justify-center mb-3">
                    <TeamIcon icon={session.design.team2.icon} size="2xl" />
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-white mb-1 drop-shadow-lg">
                    {session.design.team2.name}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-white text-sm">
                    <Users className="w-4 h-4" />
                    <span className="font-bold">
                      {getTeamPlayers('team2').length} / {session.config.maxPlayersPerTeam}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {getTeamPlayers('team2').map((player) => (
                    <div key={player.id} className="bg-white/30 backdrop-blur-sm rounded-xl px-3 py-2 text-white text-sm font-semibold">
                      {player.playerName}
                    </div>
                  ))}
                  {getTeamPlayers('team2').length === 0 && (
                    <p className="text-center text-white/70 py-4 text-sm">Waiting for players...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div className="w-full max-w-lg">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-2xl">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Individual Challenge Mode</h3>
                  <p className="text-gray-500 text-sm">Share this link for players to start their own game</p>
                </div>

                <div
                  className="rounded-2xl p-4 text-center mb-4 shadow-md"
                  style={{ background: theme.gradients.player }}
                >
                  <p className="text-white text-xs font-semibold mb-1 opacity-90">GAME LINK</p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-3">
                    <p className="text-white text-xs font-mono break-all">
                      {`${window.location.origin}/individual/${session.sessionPin}`}
                    </p>
                  </div>
                  <Button
                    onClick={copyGameLink}
                    size="lg"
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-2 text-sm"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Game Link
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                  <h4 className="font-bold text-blue-900 mb-1 text-sm">How it works:</h4>
                  <ul className="text-blue-800 space-y-1 text-xs">
                    <li>• Each player plays independently against an AI opponent</li>
                    <li>• Players can choose their difficulty level</li>
                    <li>• Results are tracked individually</li>
                    <li>• Share the link above for players to access the game</li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => window.open(`/individual/${session.sessionPin}`, '_blank')}
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-sm"
                  >
                    <Play className="w-4 h-4 mr-1.5" />
                    Preview Game
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  if (liveGame.status === 'playing') {
    const team1Territories = territories.filter(t => t.owner === 'team1').length;
    const team2Territories = territories.filter(t => t.owner === 'team2').length;

    const currentTheme = getTheme(session.design.backgroundTheme || 'win-together');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
        <div className="w-full h-screen">
          {showLeaderboard ? (
            <div className="p-8 max-w-7xl mx-auto">
              <div className="flex justify-center mb-6">
                <Button
                  onClick={() => setShowLeaderboard(false)}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Grid3x3 className="w-5 h-5" />
                  Back to Territory Map
                </Button>
              </div>
              <Leaderboard
                players={players}
                team1Name={session.design.team1.name}
                team2Name={session.design.team2.name}
                team1Color={session.design.team1.color}
                team2Color={session.design.team2.color}
                team1Icon={session.design.team1.icon}
                team2Icon={session.design.team2.icon}
              />
            </div>
          ) : (
            <HexGrid
              gridSize={session.config.hexGridSize}
              territories={territories}
              team1Color={session.design.team1.color}
              team2Color={session.design.team2.color}
              team1Name={session.design.team1.name}
              team2Name={session.design.team2.name}
              team1Icon={session.design.team1.icon}
              team2Icon={session.design.team2.icon}
              team1Score={liveGame.team1Score}
              team2Score={liveGame.team2Score}
              timeRemaining={timeRemaining}
              backgroundVideoUrl={undefined}
              islandImageUrl={session.design.customBackgroundUrl || currentTheme.backgroundImage}
              onRestart={handleRestartSession}
              showRestartButton={true}
            />
          )}

          {/* Territory Control Indicator */}
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-gradient-to-r from-stone-800/95 via-stone-900/95 to-stone-800/95 backdrop-blur-md rounded-[2rem] px-6 py-3 border-4 border-amber-600 shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: session.design.team1.color }} />
                  <span className="text-white font-bold text-sm">{team1Territories}</span>
                </div>
                <div className="text-amber-300 font-bold text-xs tracking-widest">TERRITORIES</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{team2Territories}</span>
                  <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: session.design.team2.color }} />
                </div>
              </div>
            </div>
          </div>

          {/* Floating controls for admin - Centered */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
            {!showLeaderboard && (
              <Button
                onClick={() => setShowLeaderboard(true)}
                variant="secondary"
                className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
              >
                <Trophy className="w-5 h-5" />
                Leaderboard
              </Button>
            )}
            <Button
              onClick={handleEndGame}
              variant="danger"
              className="flex items-center gap-2"
            >
              End Game
            </Button>
          </div>
        </div>
        <Confetti active={showConfetti} duration={5000} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  if (liveGame.status === 'ended') {
    const winner = liveGame.team1Score > liveGame.team2Score
      ? 'team1'
      : liveGame.team2Score > liveGame.team1Score
      ? 'team2'
      : 'tie';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 flex items-center justify-center p-8">
        <Confetti active={true} duration={10000} />
        <div className="bg-white rounded-[2rem] shadow-2xl p-12 max-w-4xl w-full text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">Game Over!</h1>

          {winner === 'tie' ? (
            <div className="mb-8">
              <p className="text-3xl font-bold text-gray-700 mb-4">It's a Tie!</p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <TeamIcon icon={session.design.team1.icon} size="2xl" />
                  </div>
                  <p className="text-xl font-semibold">{session.design.team1.name}</p>
                  <p className="text-4xl font-bold" style={{ color: session.design.team1.color }}>
                    {liveGame.team1Score}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <TeamIcon icon={session.design.team2.icon} size="2xl" />
                  </div>
                  <p className="text-xl font-semibold">{session.design.team2.name}</p>
                  <p className="text-4xl font-bold" style={{ color: session.design.team2.color }}>
                    {liveGame.team2Score}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-2xl text-gray-600 mb-4">🎉 Winner 🎉</p>
              <div className="flex justify-center mb-4">
                <TeamIcon
                  icon={winner === 'team1' ? session.design.team1.icon : session.design.team2.icon}
                  size="2xl"
                  className="!w-32 !h-32 !text-8xl"
                />
              </div>
              <h2 className="text-4xl font-bold mb-4" style={{
                color: winner === 'team1' ? session.design.team1.color : session.design.team2.color
              }}>
                {winner === 'team1' ? session.design.team1.name : session.design.team2.name}
              </h2>
              <div className="flex justify-center gap-12 text-2xl">
                <div>
                  <span className="font-semibold">{session.design.team1.name}:</span> {liveGame.team1Score}
                </div>
                <div>
                  <span className="font-semibold">{session.design.team2.name}:</span> {liveGame.team2Score}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleRestartSession}
              size="lg"
              className="px-12 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Restarting...' : 'Restart Session'}
            </Button>
            <p className="text-sm text-gray-500">This will clear all players and reset the game to lobby</p>
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  return (
    <>
      {null}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
