import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '../../components/shared/Button';
import { SessionCard } from '../../components/admin/SessionCard';
import { HelpModal } from '../../components/shared/HelpModal';
import { Loading } from '../../components/shared/Loading';
import { LogOut, Plus, Search, Zap, HelpCircle, FolderOpen, Shield, Trophy, Users, Calendar, ChevronRight, Gamepad2, Menu, X, Pencil, Play, Trash2 } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);

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

  const handleDeleteTournament = async (id: string) => {
    const ok = await tournamentService.deleteTournament(id);
    if (ok) {
      setTournaments(prev => prev.filter(t => t.id !== id));
    }
    setDeletingTournamentId(null);
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

  const statItems = [
    { label: 'Total', value: stats.total, color: eandColors.red, icon: Gamepad2 },
    { label: 'Draft', value: stats.draft, color: eandColors.grey, icon: Pencil },
    { label: 'Ready', value: stats.ready, color: eandColors.oceanBlue, icon: Zap },
    { label: 'Live', value: stats.live, color: eandColors.brightGreen, icon: Play },
    { label: 'Done', value: stats.completed, color: eandColors.darkGreen, icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-gray-50 game-dots-bg">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b" style={{ borderColor: `${eandColors.oceanBlue}08` }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)` }}>
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold leading-tight" style={{ color: eandColors.oceanBlue }}>Game Control</h1>
                <p className="text-xs" style={{ color: eandColors.grey }}>Dashboard</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleCreateNew}>
                <Plus className="w-4 h-4" /> New Session
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/tournament/new')}>
                <Trophy className="w-4 h-4" /> Tournament
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
                <FolderOpen className="w-4 h-4" /> Assets
              </Button>
              {user?.isSuperAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')}
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', color: 'white', border: 'none' }}>
                  <Shield className="w-4 h-4" /> Admin
                </Button>
              )}
              <button onClick={() => setShowHelp(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: eandColors.grey }}>
                <HelpCircle className="w-5 h-5" />
              </button>
              <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: eandColors.grey }}>
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" style={{ color: eandColors.oceanBlue }} /> : <Menu className="w-6 h-6" style={{ color: eandColors.oceanBlue }} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t" style={{ borderColor: `${eandColors.oceanBlue}08` }}
            >
              <div className="p-4 grid grid-cols-2 gap-2">
                <Button variant="primary" size="sm" onClick={() => { handleCreateNew(); setMobileMenuOpen(false); }} className="w-full">
                  <Plus className="w-4 h-4" /> Session
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { navigate('/tournament/new'); setMobileMenuOpen(false); }} className="w-full">
                  <Trophy className="w-4 h-4" /> Tournament
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { navigate('/assets'); setMobileMenuOpen(false); }} className="w-full">
                  <FolderOpen className="w-4 h-4" /> Assets
                </Button>
                {user?.isSuperAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => { navigate('/super-admin'); setMobileMenuOpen(false); }} className="w-full">
                    <Shield className="w-4 h-4" /> Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setShowHelp(true); setMobileMenuOpen(false); }} className="w-full">
                  <HelpCircle className="w-4 h-4" /> Help
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="w-full">
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 p-1 bg-white rounded-xl mb-6 shadow-sm" style={{ border: `1px solid ${eandColors.oceanBlue}08` }}>
          {[
            { key: 'sessions' as const, label: `Sessions (${sessions.length})`, icon: Zap, gradient: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)` },
            { key: 'tournaments' as const, label: `Tournaments (${tournaments.length})`, icon: Trophy, gradient: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 100%)` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={activeTab === tab.key
                ? { background: tab.gradient, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { color: eandColors.grey }
              }
            >
              <tab.icon className="w-4 h-4" /> <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === 'sessions' ? `(${sessions.length})` : `(${tournaments.length})`}</span>
            </button>
          ))}
        </div>

        {activeTab === 'sessions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {statItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="game-stat-card text-center"
                >
                  <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: eandColors.grey }}>{item.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex gap-1.5 flex-wrap flex-1">
                {(['all', 'draft', 'ready', 'live', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all mobile-touch"
                    style={filter === status
                      ? { background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`, color: 'white', boxShadow: '0 2px 8px rgba(224,8,0,0.2)' }
                      : { background: 'white', color: eandColors.oceanBlue, border: `1px solid ${eandColors.oceanBlue}10` }
                    }
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: eandColors.grey }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ border: `1px solid ${eandColors.oceanBlue}10`, color: eandColors.oceanBlue, focusRing: eandColors.brightGreen } as any}
                />
              </div>
            </div>

            {isLoading ? (
              <Loading />
            ) : filteredSessions.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="game-card p-12 text-center">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4" style={{ color: `${eandColors.oceanBlue}20` }} />
                <p className="text-lg font-medium mb-1" style={{ color: eandColors.oceanBlue }}>
                  {searchQuery ? 'No sessions found' : 'No sessions yet'}
                </p>
                <p className="text-sm mb-6" style={{ color: eandColors.grey }}>
                  {searchQuery ? 'Try a different search term' : 'Create your first game session to get started'}
                </p>
                {!searchQuery && (
                  <Button variant="primary" onClick={handleCreateNew}>
                    <Plus className="w-4 h-4" /> Create Session
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session: Session, i: number) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <SessionCard
                      session={session}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onLaunch={handleLaunch}
                      onViewResults={handleViewResults}
                      onViewDashboard={handleViewDashboard}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'tournaments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {tournamentsLoading ? (
              <Loading />
            ) : tournaments.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="game-card p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: `${eandColors.oceanBlue}20` }} />
                <p className="text-lg font-medium mb-1" style={{ color: eandColors.oceanBlue }}>No tournaments yet</p>
                <p className="text-sm mb-6" style={{ color: eandColors.grey }}>Create your first tournament to host competitive events</p>
                <Button variant="secondary" onClick={() => navigate('/tournament/new')}>
                  <Plus className="w-4 h-4" /> Create Tournament
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.map((tournament: Tournament, i: number) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="game-card group relative"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                    >
                      <div className="p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, ${eandColors.mauve} 100%)` }}>
                        <div className="absolute inset-0 game-grid-bg opacity-10" />
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2 min-w-0">
                            <Trophy className="w-5 h-5 text-white flex-shrink-0" />
                            <h3 className="font-bold text-white truncate">{tournament.name}</h3>
                          </div>
                          <span className="game-badge flex-shrink-0 ml-2" style={{
                            backgroundColor: tournament.status === 'active' ? eandColors.brightGreen : tournament.status === 'completed' ? eandColors.oceanBlue : eandColors.grey,
                            color: 'white'
                          }}>
                            {tournament.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="flex items-center gap-1" style={{ color: eandColors.grey }}>
                            <Users className="w-4 h-4" /> <span>{tournament.maxPlayersPerSession} max</span>
                          </div>
                          <div className="flex items-center gap-1" style={{ color: eandColors.grey }}>
                            <Calendar className="w-4 h-4" /> <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {tournament.description && (
                          <p className="text-sm mb-3 line-clamp-2" style={{ color: eandColors.grey }}>{tournament.description}</p>
                        )}
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="px-4 pb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/tournament/edit/${tournament.id}`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{ backgroundColor: `${eandColors.oceanBlue}10`, color: eandColors.oceanBlue }}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingTournamentId(tournament.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{ backgroundColor: `${eandColors.red}10`, color: eandColors.red }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all cursor-pointer" style={{ color: eandColors.red }}
                        onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Delete Confirmation Overlay */}
                    <AnimatePresence>
                      {deletingTournamentId === tournament.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
                          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <div className="text-center p-6">
                            <Trash2 className="w-10 h-10 mx-auto mb-3 text-red-400" />
                            <p className="text-white font-bold mb-1">Delete Tournament?</p>
                            <p className="text-white/70 text-sm mb-4">"{tournament.name}" and all its data will be permanently removed.</p>
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={() => setDeletingTournamentId(null)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/20 text-white hover:bg-white/30 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteTournament(tournament.id)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                                style={{ backgroundColor: eandColors.red }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} role="admin" />
    </div>
  );
}
