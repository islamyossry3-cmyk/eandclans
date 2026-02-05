import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService, type Tournament, type TournamentPlayer } from '../../services/tournamentService';
import { useTournamentStore } from '../../stores/tournamentStore';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Loading } from '../../components/shared/Loading';
import { eandColors } from '../../constants/eandColors';
import { Trophy, Users, Calendar, Globe, CheckCircle } from 'lucide-react';

export function TournamentJoinPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { setCurrentTournament, setCurrentPlayer } = useTournamentStore();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  const [formData, setFormData] = useState({
    playerName: '',
    email: '',
    preferredLanguage: 'en' as 'en' | 'ar',
  });

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  const loadTournament = async () => {
    setIsLoading(true);
    const data = await tournamentService.getTournament(tournamentId!);
    setTournament(data);
    setIsLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (formData.playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setIsJoining(true);

    // Check if player already exists
    let player = await tournamentService.getPlayer(tournamentId!, formData.playerName.trim());

    if (!player) {
      // Register new player
      player = await tournamentService.registerPlayer({
        tournamentId: tournamentId!,
        playerName: formData.playerName.trim(),
        email: formData.email.trim() || undefined,
        preferredLanguage: formData.preferredLanguage,
      });
    }

    setIsJoining(false);

    if (player) {
      setCurrentTournament(tournament);
      setCurrentPlayer(player);
      setJoined(true);
      
      // Navigate to tournament game after short delay
      setTimeout(() => {
        navigate(`/tournament/${tournamentId}/play`);
      }, 1500);
    } else {
      setError('Failed to join tournament. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: eandColors.grey }} />
          <h1 className="text-2xl font-bold mb-4" style={{ color: eandColors.oceanBlue }}>
            Tournament Not Found
          </h1>
          <p style={{ color: eandColors.grey }}>
            This tournament doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (tournament.status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: eandColors.brightGreen }} />
          <h1 className="text-2xl font-bold mb-4" style={{ color: eandColors.oceanBlue }}>
            Tournament Completed
          </h1>
          <p style={{ color: eandColors.grey }}>
            This tournament has ended. Check with the organizer for results.
          </p>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${eandColors.brightGreen}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: eandColors.brightGreen }} />
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: eandColors.oceanBlue }}>
            You're In!
          </h1>
          <p style={{ color: eandColors.grey }}>
            Welcome to {tournament.name}. Redirecting to the game...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
      <div className="w-full max-w-lg">
        {/* Tournament Info Card */}
        <div
          className="rounded-t-3xl p-6 text-center"
          style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.red} 100%)` }}
        >
          <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
          <h1 className="text-2xl font-bold text-white mb-2">{tournament.name}</h1>
          {tournament.description && (
            <p className="text-white/80 text-sm">{tournament.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(tournament.startDate)}</span>
            </div>
            <span>→</span>
            <span>{formatDate(tournament.endDate)}</span>
          </div>
        </div>

        {/* Join Form */}
        <div className="bg-white rounded-b-3xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: eandColors.oceanBlue }}>
            Join Tournament
          </h2>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                Your Name *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: eandColors.mediumGrey }} />
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={formData.playerName}
                  onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                Email (Optional)
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                Preferred Language
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: formData.preferredLanguage === 'en' ? eandColors.oceanBlue : eandColors.lightGrey,
                    color: formData.preferredLanguage === 'en' ? 'white' : eandColors.oceanBlue,
                  }}
                  onClick={() => setFormData({ ...formData, preferredLanguage: 'en' })}
                >
                  <Globe className="w-4 h-4" />
                  English
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: formData.preferredLanguage === 'ar' ? eandColors.oceanBlue : eandColors.lightGrey,
                    color: formData.preferredLanguage === 'ar' ? 'white' : eandColors.oceanBlue,
                  }}
                  onClick={() => setFormData({ ...formData, preferredLanguage: 'ar' })}
                >
                  <Globe className="w-4 h-4" />
                  العربية
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: `${eandColors.red}10`, border: `1px solid ${eandColors.red}30` }}
              >
                <p className="text-sm" style={{ color: eandColors.red }}>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isJoining || !formData.playerName.trim()}
            >
              {isJoining ? 'Joining...' : 'Join Tournament'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t" style={{ borderColor: eandColors.lightGrey }}>
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <p className="font-bold" style={{ color: eandColors.oceanBlue }}>
                  {tournament.sessionDurationSeconds / 60} min
                </p>
                <p style={{ color: eandColors.grey }}>Session Duration</p>
              </div>
              <div>
                <p className="font-bold" style={{ color: eandColors.oceanBlue }}>
                  {tournament.maxPlayersPerSession}
                </p>
                <p style={{ color: eandColors.grey }}>Max Players</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
