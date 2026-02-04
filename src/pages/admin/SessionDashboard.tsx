import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Users, Trophy, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Loading } from '../../components/shared/Loading';
import { supabase } from '../../lib/supabase';
import type { Session, IndividualGameEntry } from '../../types/session';

export function SessionDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<IndividualGameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    averageScore: 0,
    highestScore: 0,
    averageTime: 0,
    completionRate: 0,
  });

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!sessionData) {
        navigate('/admin/dashboard');
        return;
      }

      setSession(sessionData as unknown as Session);

      const { data: entriesData, error: entriesError } = await supabase
        .from('individual_game_entries')
        .select('*')
        .eq('session_id', sessionId)
        .order('completed_at', { ascending: false });

      if (entriesError) throw entriesError;

      const formattedEntries = (entriesData || []) as unknown as IndividualGameEntry[];
      setEntries(formattedEntries);

      if (formattedEntries.length > 0) {
        const totalScore = formattedEntries.reduce((sum, e) => sum + e.score, 0);
        const totalTime = formattedEntries.reduce((sum, e) => sum + Number(e.totalTime), 0);
        const maxScore = Math.max(...formattedEntries.map(e => e.score));

        setStats({
          totalPlayers: formattedEntries.length,
          averageScore: Math.round(totalScore / formattedEntries.length),
          highestScore: maxScore,
          averageTime: Math.round(totalTime / formattedEntries.length),
          completionRate: 100,
        });
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (entries.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Player Name', 'Email', 'Organization', 'Score', 'Correct', 'Wrong', 'Timeout', 'Total Time (s)', 'Completed At'];
    const rows = entries.map(entry => [
      entry.playerName,
      entry.playerEmail || '',
      entry.playerOrganization || '',
      entry.score,
      entry.correctCount,
      entry.wrongCount,
      entry.timeoutCount,
      Number(entry.totalTime).toFixed(2),
      new Date(entry.completedAt).toLocaleString(),
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        const value = String(cell);
        return value.includes(',') ? `"${value}"` : value;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${session?.name.replace(/\s+/g, '_')}_entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button onClick={() => navigate('/admin/dashboard')} variant="secondary">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Sessions
          </Button>
          <Button onClick={exportToExcel} disabled={entries.length === 0}>
            <Download className="w-5 h-5 mr-2" />
            Export to CSV
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{session.name}</h1>
          <p className="text-gray-600 mb-4">{session.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {session.type === 'individual' ? 'Individual Play' : 'Team Battle'}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              PIN: {session.sessionPin}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 text-blue-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.totalPlayers}</span>
            </div>
            <p className="text-gray-600 font-medium">Total Players</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10 text-green-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.averageScore}</span>
            </div>
            <p className="text-gray-600 font-medium">Average Score</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-10 h-10 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.highestScore}</span>
            </div>
            <p className="text-gray-600 font-medium">Highest Score</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-10 h-10 text-purple-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.averageTime}s</span>
            </div>
            <p className="text-gray-600 font-medium">Avg Time</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Player Entries</h2>
            <p className="text-gray-600">All game completions for this session</p>
          </div>

          {entries.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No entries yet</p>
              <p className="text-gray-400 text-sm">Players will appear here once they complete the game</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Player</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Organization</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Score</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Correct</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Wrong</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Timeout</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Time (s)</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.playerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{entry.playerEmail || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{entry.playerOrganization || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-800 font-bold">
                          {entry.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-green-600 font-medium">{entry.correctCount}</td>
                      <td className="px-6 py-4 text-center text-sm text-red-600 font-medium">{entry.wrongCount}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">{entry.timeoutCount}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{Number(entry.totalTime).toFixed(1)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(entry.completedAt).toLocaleDateString()}<br />
                        <span className="text-xs text-gray-400">{new Date(entry.completedAt).toLocaleTimeString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
