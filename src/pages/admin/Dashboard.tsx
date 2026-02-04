import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '../../components/shared/Button';
import { SessionCard } from '../../components/admin/SessionCard';
import { HelpModal } from '../../components/shared/HelpModal';
import { LogOut, Plus, Search, Zap, HelpCircle, FolderOpen, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '../../types/session';
import { eandColors, eandGradients } from '../../constants/eandColors';

export function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const { sessions, isLoading, fetchSessions, deleteSession, duplicateSession } = useSessionStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'draft' | 'ready' | 'live' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (user) {
      const adminId = getAdminId();
      if (adminId) {
        fetchSessions(adminId);
      }
    }
  }, [user]);

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

  const filteredSessions = sessions.filter((session) => {
    const matchesFilter = filter === 'all' || session.status === filter;
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: sessions.length,
    draft: sessions.filter((s) => s.status === 'draft').length,
    ready: sessions.filter((s) => s.status === 'ready').length,
    live: sessions.filter((s) => s.status === 'live').length,
    completed: sessions.filter((s) => s.status === 'completed').length,
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 rounded-lg bg-white focus:outline-none focus:ring-2"
                style={{
                  borderColor: eandColors.mediumGrey,
                  color: eandColors.oceanBlue
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = eandColors.red;
                  e.target.style.boxShadow = `0 0 0 3px ${eandColors.red}20`;
                }}
                onBlur={(e) => {
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
            {filteredSessions.map((session) => (
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
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} role="admin" />
    </div>
  );
}
