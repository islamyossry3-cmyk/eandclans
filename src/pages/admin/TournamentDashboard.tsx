import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService, type Tournament, type TournamentSession, type TournamentPlayer } from '../../services/tournamentService';
import { Button } from '../../components/shared/Button';
import { Loading } from '../../components/shared/Loading';
import { eandColors } from '../../constants/eandColors';
import { 
  Trophy, ArrowLeft, Play, Pause, Users, Clock, 
  Calendar, Award, TrendingUp, RefreshCw 
} from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function TournamentDashboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sessions, setSessions] = useState<TournamentSession[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (!tournament) return;

    const channels: RealtimeChannel[] = [];

    const tournamentChannel = tournamentService.subscribeToTournament(
      tournament.id,
      (updated) => setTournament(updated)
    );
    channels.push(tournamentChannel);

    const sessionsChannel = tournamentService.subscribeToTournamentSessions(
      tournament.id,
      (updated) => setSessions(updated)
    );
    channels.push(sessionsChannel);

    const playersChannel = tournamentService.subscribeToTournamentPlayers(
      tournament.id,
      (updated) => setPlayers(updated)
    );
    channels.push(playersChannel);

    return () => {
      channels.forEach((ch) => ch.unsubscribe());
    };
  }, [tournament?.id]);

  const loadTournament = async () => {
    setIsLoading(true);
    
    const [tournamentData, sessionsData, playersData] = await Promise.all([
      tournamentService.getTournament(tournamentId!),
      tournamentService.getTournamentSessions(tournamentId!),
      tournamentService.getTournamentPlayers(tournamentId!),
    ]);

    setTournament(tournamentData);
    setSessions(sessionsData);
    setPlayers(playersData);
    setIsLoading(false);
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'completed') => {
    if (!tournament) return;
    
    setIsUpdating(true);
    await tournamentService.updateTournament(tournament.id, { status: newStatus });
    setIsUpdating(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return eandColors.brightGreen;
      case 'paused': return eandColors.sandRed;
      case 'completed': return eandColors.oceanBlue;
      default: return eandColors.grey;
    }
  };

  const currentSession = sessions.find((s: TournamentSession) => s.status === 'active');
  const completedSessions = sessions.filter((s: TournamentSession) => s.status === 'completed').length;
  const topPlayers = [...players].sort((a, b) => b.totalCredits - a.totalCredits).slice(0, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <Loading />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold mb-4" style={{ color: eandColors.oceanBlue }}>Tournament Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: eandColors.lightGrey }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: eandColors.oceanBlue }} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold" style={{ color: eandColors.oceanBlue }}>
                  {tournament.name}
                </h1>
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold uppercase"
                  style={{
                    backgroundColor: `${getStatusColor(tournament.status)}20`,
                    color: getStatusColor(tournament.status),
                  }}
                >
                  {tournament.status}
                </span>
              </div>
              <p style={{ color: eandColors.grey }}>{tournament.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={loadTournament}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            {tournament.status === 'scheduled' && (
              <Button
                onClick={() => handleStatusChange('active')}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
                disabled={isUpdating}
              >
                <Play className="w-4 h-4" />
                Start Tournament
              </Button>
            )}
            {tournament.status === 'active' && (
              <Button
                onClick={() => handleStatusChange('paused')}
                className="flex items-center gap-2"
                disabled={isUpdating}
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {tournament.status === 'paused' && (
              <Button
                onClick={() => handleStatusChange('active')}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
                disabled={isUpdating}
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5" style={{ color: eandColors.oceanBlue }} />
              <span className="text-sm font-semibold" style={{ color: eandColors.grey }}>Total Players</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: eandColors.oceanBlue }}>{players.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
              <span className="text-sm font-semibold" style={{ color: eandColors.grey }}>Sessions Completed</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: eandColors.brightGreen }}>{completedSessions}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5" style={{ color: eandColors.mauve }} />
              <span className="text-sm font-semibold" style={{ color: eandColors.grey }}>Start Date</span>
            </div>
            <p className="text-lg font-bold" style={{ color: eandColors.mauve }}>{formatDate(tournament.startDate)}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5" style={{ color: eandColors.red }} />
              <span className="text-sm font-semibold" style={{ color: eandColors.grey }}>End Date</span>
            </div>
            <p className="text-lg font-bold" style={{ color: eandColors.red }}>{formatDate(tournament.endDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Session */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eandColors.brightGreen}15` }}
              >
                <Play className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>
                Current Session
              </h2>
            </div>

            {currentSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span style={{ color: eandColors.grey }}>Session #</span>
                  <span className="font-bold" style={{ color: eandColors.oceanBlue }}>
                    {currentSession.sessionNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: eandColors.grey }}>Started At</span>
                  <span className="font-bold" style={{ color: eandColors.oceanBlue }}>
                    {currentSession.actualStart ? formatDate(currentSession.actualStart) : 'Not started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: eandColors.grey }}>Team 1 Score</span>
                  <span className="font-bold text-xl" style={{ color: eandColors.red }}>
                    {currentSession.team1FinalScore}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: eandColors.grey }}>Team 2 Score</span>
                  <span className="font-bold text-xl" style={{ color: eandColors.oceanBlue }}>
                    {currentSession.team2FinalScore}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p style={{ color: eandColors.grey }}>No active session</p>
                <p className="text-sm mt-2" style={{ color: eandColors.mediumGrey }}>
                  Sessions auto-cycle every {(tournament.sessionDurationSeconds + tournament.breakDurationSeconds) / 60} minutes
                </p>
              </div>
            )}
          </div>

          {/* Top Players Leaderboard */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eandColors.red}15` }}
              >
                <Trophy className="w-5 h-5" style={{ color: eandColors.red }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>
                Top Players
              </h2>
            </div>

            {topPlayers.length > 0 ? (
              <div className="space-y-3">
                {topPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: index < 3 ? `${eandColors.brightGreen}10` : eandColors.lightGrey }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{
                          backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : eandColors.mediumGrey,
                          color: 'white',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="font-semibold" style={{ color: eandColors.oceanBlue }}>
                        {player.playerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" style={{ color: eandColors.brightGreen }} />
                      <span className="font-bold" style={{ color: eandColors.brightGreen }}>
                        {player.totalCredits} credits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p style={{ color: eandColors.grey }}>No players yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Session History */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${eandColors.oceanBlue}15` }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: eandColors.oceanBlue }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>
              Session History
            </h2>
          </div>

          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${eandColors.lightGrey}` }}>
                    <th className="text-left py-3 px-4" style={{ color: eandColors.grey }}>#</th>
                    <th className="text-left py-3 px-4" style={{ color: eandColors.grey }}>Status</th>
                    <th className="text-left py-3 px-4" style={{ color: eandColors.grey }}>Scheduled</th>
                    <th className="text-center py-3 px-4" style={{ color: eandColors.grey }}>Team 1</th>
                    <th className="text-center py-3 px-4" style={{ color: eandColors.grey }}>Team 2</th>
                    <th className="text-center py-3 px-4" style={{ color: eandColors.grey }}>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} style={{ borderBottom: `1px solid ${eandColors.lightGrey}` }}>
                      <td className="py-3 px-4 font-bold" style={{ color: eandColors.oceanBlue }}>
                        {session.sessionNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-bold uppercase"
                          style={{
                            backgroundColor: `${getStatusColor(session.status)}20`,
                            color: getStatusColor(session.status),
                          }}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: eandColors.grey }}>
                        {formatDate(session.scheduledStart)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: eandColors.red }}>
                        {session.team1FinalScore}
                      </td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: eandColors.oceanBlue }}>
                        {session.team2FinalScore}
                      </td>
                      <td className="py-3 px-4 text-center font-bold" style={{ color: eandColors.brightGreen }}>
                        {session.winner ? session.winner.toUpperCase() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: eandColors.grey }}>No sessions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
