import { useState } from 'react';
import type { Session } from '../../types/session';
import { Button } from '../shared/Button';
import { Users, Calendar, Edit, Trash2, Copy, Play, BarChart, LayoutDashboard } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { eandColors } from '../../constants/eandColors';

interface SessionCardProps {
  session: Session;
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onDuplicate: (sessionId: string) => void;
  onLaunch: (session: Session) => void;
  onViewResults?: (session: Session) => void;
  onViewDashboard?: (session: Session) => void;
}

export function SessionCard({
  session,
  onEdit,
  onDelete,
  onDuplicate,
  onLaunch,
  onViewResults,
  onViewDashboard,
}: SessionCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const statusStyles = {
    draft: { backgroundColor: eandColors.grey, color: 'white', borderColor: eandColors.grey },
    ready: { backgroundColor: eandColors.oceanBlue, color: 'white', borderColor: eandColors.oceanBlue },
    live: { backgroundColor: eandColors.brightGreen, color: 'white', borderColor: eandColors.brightGreen },
    completed: { backgroundColor: eandColors.brightGreen, color: 'white', borderColor: eandColors.brightGreen },
  };

  const typeStyles = {
    team_battle: { backgroundColor: eandColors.red, color: 'white', borderColor: eandColors.red },
    individual: { backgroundColor: eandColors.oceanBlue, color: 'white', borderColor: eandColors.oceanBlue },
  };

  const cardStyles = {
    team_battle: {
      background: `linear-gradient(135deg, ${eandColors.red}08 0%, ${eandColors.oceanBlue}05 100%)`,
      borderColor: `${eandColors.red}60`
    },
    individual: {
      background: `linear-gradient(135deg, ${eandColors.oceanBlue}08 0%, ${eandColors.brightGreen}05 100%)`,
      borderColor: `${eandColors.oceanBlue}60`
    },
  };

  const handleDelete = () => {
    onDelete(session.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className="backdrop-blur-sm rounded-[2rem] border-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.2)] transition-all duration-300 p-6 transform hover:-translate-y-2 hover:scale-[1.02] bg-white"
        style={cardStyles[session.type]}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide" style={{ color: eandColors.oceanBlue }}>{session.name}</h3>
            {session.description && (
              <p className="text-sm mb-3 line-clamp-2" style={{ color: eandColors.grey }}>
                {session.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <span
            className="px-3 py-1 rounded-xl border-2 text-xs font-bold uppercase tracking-wider shadow-md"
            style={statusStyles[session.status]}
          >
            {session.status.toUpperCase()}
          </span>
          <span
            className="px-3 py-1 rounded-xl border-2 text-xs font-bold uppercase tracking-wider shadow-md"
            style={typeStyles[session.type]}
          >
            {session.type === 'team_battle' ? 'TEAM BATTLE' : 'INDIVIDUAL'}
          </span>
        </div>

        <div className="space-y-2 mb-4 text-sm" style={{ color: eandColors.oceanBlue }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: eandColors.brightGreen }} />
            <span className="font-semibold">{new Date(session.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: eandColors.brightGreen }} />
            <span className="font-semibold">{session.questions.length} Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: eandColors.red }}>PIN:</span>
            <span
              className="font-mono px-3 py-1 rounded-xl border-2 font-bold tracking-wider shadow-md"
              style={{
                backgroundColor: `${eandColors.red}08`,
                borderColor: eandColors.red,
                color: eandColors.red
              }}
            >
              {session.sessionPin}
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onEdit(session)}
            className="flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </Button>

          {(session.status === 'ready' || session.status === 'draft') && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onLaunch(session)}
              className="flex items-center gap-1"
              style={{ background: `linear-gradient(135deg, ${eandColors.brightGreen} 0%, #3ab85d 100%)` }}
            >
              <Play className="w-3 h-3" />
              Launch
            </Button>
          )}

          {session.status === 'completed' && onViewResults && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onViewResults(session)}
              className="flex items-center gap-1"
              style={{ background: `linear-gradient(135deg, ${eandColors.burgundy} 0%, #5c0018 100%)` }}
            >
              <BarChart className="w-3 h-3" />
              View Results
            </Button>
          )}

          {session.type === 'individual' && onViewDashboard && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onViewDashboard(session)}
              className="flex items-center gap-1"
            >
              <LayoutDashboard className="w-3 h-3" />
              Dashboard
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDuplicate(session.id)}
            className="flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            Copy
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Session"
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: eandColors.oceanBlue }}>
            Are you sure you want to delete <strong>{session.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
