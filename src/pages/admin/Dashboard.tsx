import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '../../components/shared/Button';
import { SessionCard } from '../../components/admin/SessionCard';
import { HelpModal } from '../../components/shared/HelpModal';
import { LogOut, Plus, Search, Zap, HelpCircle, FolderOpen, Shield, Trophy, Users, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '../../types/session';
import { eandColors } from '../../constants/eandColors';
import { tournamentService, type Tournament } from '../../services/tournamentService';

export function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const { sessions, isLoading, fetchSessions, deleteSession, duplicateSession } = useSessionStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'draft' | 'ready' | 'live' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'tournaments'>('sessions');

  useEffect(() => {
    if (user) {
      const adminId = getAdminId();
      if (adminId) {
        fetchSessions(adminId);
        loadTournaments(adminId);
      }
    }
  }, [user]);

  const loadTournaments = async (adminId: string) => {
    setTournamentsLoading(true);
    const data = await tournamentService.getTournamentsByAdmin(adminId);
    setTournaments(data);
    setTournamentsLoading(false);
  };

  const getAdminId = () => {
    return user?.adminId;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleEdit = (session: Session) => {
    navigate(`/session/edit/${session.id}`);
  };

  const handleDelete = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  const handleDuplicate = async (sessionId: string) => {
    const adminId = getAdminId();
    if (adminId) {
      await duplicateSession(sessionId, adminId);
    }
  };

  const handleLaunch = (session: Session) => {
    window.open(`/live/${session.sessionPin}`, '_blank');
  };

  const handleViewResults = (session: Session) => {
    navigate(`/results/${session.sessionPin}`);
  };

  const handleViewDashboard = (session: Session) => {
    navigate(`/session/dashboard/${session.id}`);
  };

  const handleCreateNew = () => {
    navigate('/session/new');
  };

  const filteredSessions = sessions.filter((session: Session) => {
    const matchesFilter = filter === 'all' || session.status === filter;
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: sessions.length,
    draft: sessions.filter((s: Session) => s.status === 'draft').length,
    ready: sessions.filter((s: Session) => s.status === 'ready').length,
    live: sessions.filter((s: Session) => s.status === 'live').length,
    completed: sessions.filter((s: Session) => s.status === 'completed').length,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: eandColors.lightGrey }}>
      <div className="bg-white shadow-lg border-b-4" style={{ borderColor: eandColors.red }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="https://www.eand.com.eg/portal/images/logo/etisalat_logo.svg"
                alt="e& logo"
                className="h-12"
                style={{ maxHeight: '48px' }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleCreateNew}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Session
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/tournament/new')}
                className="flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 100%)`, border: 'none', color: 'white' }}
              >
                <Trophy className="w-4 h-4" />
                New Tournament
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Assets
              </Button>
              {user?.isSuperAdmin && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/super-admin')}
                  className="flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <Shield className="w-4 h-4" />
                  Super Admin
                </Button>
              )}
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 hover:opacity-80 transition-opacity"
                style={{ color: eandColors.grey }}
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <Button
                variant="secondary"
                onClick={handleSignOut}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${eandColors.mediumGrey}`,
                  color: eandColors.oceanBlue
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 rounded-lg font-bold uppercase text-sm tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2`}
            style={
              activeTab === 'sessions'
                ? { background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`, color: 'white' }
                : { background: 'white', color: eandColors.oceanBlue, border: `2px solid ${eandColors.mediumGrey}` }
            }
          >
            <Zap className="w-4 h-4" />
            Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-6 py-3 rounded-lg font-bold uppercase text-sm tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2`}
            style={
              activeTab === 'tournaments'
                ? { background: `linear-gradient(135deg, ${eandColors.mauve} 0%, ${eandColors.oceanBlue} 100%)`, color: 'white' }
                : { background: 'white', color: eandColors.oceanBlue, border: `2px solid ${eandColors.mediumGrey}` }
            }
          >
            <Trophy className="w-4 h-4" />
            Tournaments ({tournaments.length})
          </button>
        </div>

        {activeTab === 'sessions' && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="rounded-lg shadow-md p-6 bg-white border-2" style={{ borderColor: eandColors.red }}>
            <div className="text-4xl font-bold" style={{ color: eandColors.red }}>{stats.total}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>Total Sessions</div>
          </div>
          <div className="rounded-lg shadow-md p-6 bg-white border-2" style={{ borderColor: eandColors.grey }}>
            <div className="text-4xl font-bold" style={{ color: eandColors.oceanBlue }}>{stats.draft}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>Draft</div>
          </div>
          <div className="rounded-lg shadow-md p-6 bg-white border-2" style={{ borderColor: eandColors.oceanBlue }}>
            <div className="text-4xl font-bold" style={{ color: eandColors.oceanBlue }}>{stats.ready}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>Ready</div>
          </div>
          <div className="rounded-lg shadow-md p-6 bg-white border-2" style={{ borderColor: eandColors.brightGreen }}>
            <div className="text-4xl font-bold" style={{ color: eandColors.brightGreen }}>{stats.live}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>Live</div>
          </div>
          <div className="rounded-lg shadow-md p-6 bg-white border-2" style={{ borderColor: eandColors.brightGreen }}>
            <div className="text-4xl font-bold" style={{ color: eandColors.brightGreen }}>{stats.completed}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>Completed</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 shadow-md p-6 mb-6" style={{ borderColor: eandColors.mediumGrey }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'draft', 'ready', 'live', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className="px-5 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all shadow-md hover:shadow-lg"
                  style={
                    filter === status
                      ? {
                          background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`,
                          color: 'white',
                          border: 'none'
                        }
                      : {
                          background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0f0c35 100%)`,
                          color: 'white',
                          border: 'none'
                        }
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: eandColors.grey }} />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 rounded-lg bg-white focus:outline-none focus:ring-2"
                style={{
                  borderColor: eandColors.mediumGrey,
                  color: eandColors.oceanBlue
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = eandColors.red;
                  e.target.style.boxShadow = `0 0 0 3px ${eandColors.red}20`;
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  e.target.style.borderColor = eandColors.mediumGrey;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 rounded-full" style={{
              borderColor: `${eandColors.red}30`,
              borderTopColor: eandColors.red
            }} />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center border-2" style={{ borderColor: eandColors.mediumGrey }}>
            <p className="text-lg mb-4" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>
              {searchQuery ? 'No sessions found matching your search.' : 'No sessions yet. Create your first session to get started!'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                onClick={handleCreateNew}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Session
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session: Session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onLaunch={handleLaunch}
                onViewResults={handleViewResults}
                onViewDashboard={handleViewDashboard}
              />
            ))}
          </div>
        )}
        </>
        )}

        {activeTab === 'tournaments' && (
          <>
            {tournamentsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-12 w-12 border-4 rounded-full" style={{
                  borderColor: `${eandColors.mauve}30`,
                  borderTopColor: eandColors.mauve
                }} />
              </div>
            ) : tournaments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center border-2" style={{ borderColor: eandColors.mediumGrey }}>
                <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: eandColors.mauve }} />
                <p className="text-lg mb-4" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>
                  No tournaments yet. Create your first tournament to get started!
                </p>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/tournament/new')}
                  className="flex items-center gap-2 mx-auto"
                  style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 100%)`, border: 'none', color: 'white' }}
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Tournament
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament: Tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-xl shadow-md border-2 overflow-hidden hover:shadow-xl transition-all cursor-pointer animate-fade-in"
                    style={{ borderColor: eandColors.mediumGrey }}
                    onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                  >
                    <div
                      className="p-4"
                      style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 100%)` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-white" />
                          <h3 className="font-bold text-white truncate">{tournament.name}</h3>
                        </div>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-bold uppercase"
                          style={{
                            backgroundColor: tournament.status === 'active' ? eandColors.brightGreen : 
                                           tournament.status === 'completed' ? eandColors.oceanBlue : 
                                           tournament.status === 'paused' ? eandColors.sandRed : eandColors.grey,
                            color: 'white'
                          }}
                        >
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-1" style={{ color: eandColors.grey }}>
                          <Users className="w-4 h-4" />
                          <span>{tournament.maxPlayersPerSession} max</span>
                        </div>
                        <div className="flex items-center gap-1" style={{ color: eandColors.grey }}>
                          <Calendar className="w-4 h-4" />
                          <span>{Math.round((new Date(tournament.endDate).getTime() - new Date(tournament.startDate).getTime()) / (tournament.sessionDurationSeconds * 1000))} sessions</span>
                        </div>
                      </div>
                      {tournament.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: eandColors.oceanBlue, opacity: 0.7 }}>
                          {tournament.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: eandColors.lightGrey }}>
                        <span className="text-xs" style={{ color: eandColors.grey }}>
                          {new Date(tournament.startDate).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-medium" style={{ color: eandColors.oceanBlue }}>
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} role="admin" />
    </div>
  );
}
