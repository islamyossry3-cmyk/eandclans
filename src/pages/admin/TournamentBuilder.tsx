import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { tournamentService } from '../../services/tournamentService';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { eandColors } from '../../constants/eandColors';
import { Trophy, Calendar, Clock, Users, ArrowLeft, Save } from 'lucide-react';

export function TournamentBuilderPage() {
  const navigate = useNavigate();
  const { admin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    sessionDuration: 8,
    breakDuration: 2,
    maxPlayersPerSession: 50,
    maxPlayersPerTeam: 25,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!admin) {
      setError('You must be logged in to create a tournament');
      return;
    }

    if (!formData.name.trim()) {
      setError('Tournament name is required');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      setError('End date must be after start date');
      return;
    }

    setIsLoading(true);

    const tournament = await tournamentService.createTournament({
      adminId: admin.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      sessionDurationSeconds: formData.sessionDuration * 60,
      breakDurationSeconds: formData.breakDuration * 60,
      maxPlayersPerSession: formData.maxPlayersPerSession,
      maxPlayersPerTeam: formData.maxPlayersPerTeam,
    });

    setIsLoading(false);

    if (tournament) {
      navigate(`/admin/tournaments/${tournament.id}`);
    } else {
      setError('Failed to create tournament. Please try again.');
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: eandColors.lightGrey }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: eandColors.oceanBlue }} />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: eandColors.oceanBlue }}>
              Create Tournament
            </h1>
            <p style={{ color: eandColors.grey }}>
              Set up a multi-day group tournament with auto-cycling sessions
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eandColors.red}15` }}
              >
                <Trophy className="w-5 h-5" style={{ color: eandColors.red }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>
                Tournament Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Tournament Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Q1 Knowledge Challenge 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 rounded-xl bg-white transition-all focus:outline-none focus:ring-4 resize-none"
                  style={{ borderColor: eandColors.mediumGrey, color: eandColors.oceanBlue }}
                  rows={3}
                  placeholder="Describe your tournament..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eandColors.brightGreen}15` }}
              >
                <Calendar className="w-5 h-5" style={{ color: eandColors.brightGreen }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>
                Schedule
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Start Time
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  End Date *
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  End Time
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Session Settings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eandColors.oceanBlue}15` }}
              >
                <Clock className="w-5 h-5" style={{ color: eandColors.oceanBlue }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>
                Session Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Session Duration (minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.sessionDuration}
                  onChange={(e) => setFormData({ ...formData, sessionDuration: parseInt(e.target.value) || 8 })}
                />
                <p className="text-xs mt-1" style={{ color: eandColors.grey }}>
                  How long each game session lasts
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Break Duration (minutes)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={formData.breakDuration}
                  onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 2 })}
                />
                <p className="text-xs mt-1" style={{ color: eandColors.grey }}>
                  Break between sessions
                </p>
              </div>
            </div>

            <div
              className="mt-4 p-4 rounded-xl"
              style={{ backgroundColor: `${eandColors.brightGreen}10`, border: `1px solid ${eandColors.brightGreen}30` }}
            >
              <p className="text-sm font-medium" style={{ color: eandColors.darkGreen }}>
                Sessions will auto-cycle every {formData.sessionDuration + formData.breakDuration} minutes
              </p>
            </div>
          </div>

          {/* Player Settings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eandColors.mauve}15` }}
              >
                <Users className="w-5 h-5" style={{ color: eandColors.mauve }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: eandColors.oceanBlue }}>
                Player Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Max Players Per Session
                </label>
                <Input
                  type="number"
                  min={2}
                  max={200}
                  value={formData.maxPlayersPerSession}
                  onChange={(e) => setFormData({ ...formData, maxPlayersPerSession: parseInt(e.target.value) || 50 })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: eandColors.oceanBlue }}>
                  Max Players Per Team
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.maxPlayersPerTeam}
                  onChange={(e) => setFormData({ ...formData, maxPlayersPerTeam: parseInt(e.target.value) || 25 })}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: `${eandColors.red}10`, border: `1px solid ${eandColors.red}30` }}
            >
              <p className="text-sm font-medium" style={{ color: eandColors.red }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Creating...' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
