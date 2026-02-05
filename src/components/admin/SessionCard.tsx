import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Session } from '../../types/session';
import { Button } from '../shared/Button';
import { Calendar, Pencil, Trash2, Copy, Play, BarChart, LayoutDashboard, Hash, HelpCircle } from 'lucide-react';
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

export function SessionCard({ session, onEdit, onDelete, onDuplicate, onLaunch, onViewResults, onViewDashboard }: SessionCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const statusConfig: Record<string, { bg: string; label: string }> = {
    draft: { bg: eandColors.grey, label: 'Draft' },
    ready: { bg: eandColors.oceanBlue, label: 'Ready' },
    live: { bg: eandColors.brightGreen, label: 'Live' },
    completed: { bg: eandColors.darkGreen, label: 'Done' },
  };

  const status = statusConfig[session.status] || statusConfig.draft;

  const handleDelete = () => {
    onDelete(session.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="game-card overflow-hidden group">
        <div className="p-1.5">
          <div className="flex items-start gap-3 p-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{ background: session.type === 'team_battle' ? `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)` : `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0f0c35 100%)` }}
            >
              {session.type === 'team_battle' ? 'TB' : 'IN'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold truncate" style={{ color: eandColors.oceanBlue }}>{session.name}</h3>
                <span className="game-badge flex-shrink-0" style={{ backgroundColor: status.bg, color: 'white', fontSize: '9px', padding: '2px 8px' }}>
                  {status.label}
                </span>
              </div>
              {session.description && (
                <p className="text-xs line-clamp-1 mb-2" style={{ color: eandColors.grey }}>{session.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: eandColors.grey }}>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  {session.questions.length}Q
                </span>
                <span
                  className="flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${eandColors.red}08`, color: eandColors.red, fontSize: '11px' }}
                >
                  <Hash className="w-3 h-3" />
                  {session.sessionPin}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 px-3 pb-3 flex-wrap">
            <Button size="sm" variant="ghost" onClick={() => onEdit(session)} style={{ padding: '4px 10px', fontSize: '11px' }}>
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            {(session.status === 'ready' || session.status === 'draft') && (
              <Button size="sm" variant="success" onClick={() => onLaunch(session)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                <Play className="w-3 h-3" /> Launch
              </Button>
            )}
            {session.status === 'completed' && onViewResults && (
              <Button size="sm" variant="secondary" onClick={() => onViewResults(session)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                <BarChart className="w-3 h-3" /> Results
              </Button>
            )}
            {session.type === 'individual' && onViewDashboard && (
              <Button size="sm" variant="ghost" onClick={() => onViewDashboard(session)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                <LayoutDashboard className="w-3 h-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onDuplicate(session.id)} style={{ padding: '4px 10px', fontSize: '11px' }}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowDeleteModal(true)}
              style={{ padding: '4px 10px', fontSize: '11px', color: eandColors.red, borderColor: `${eandColors.red}15` }}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Session" size="sm">
        <div className="space-y-4">
          <p style={{ color: eandColors.oceanBlue }}>
            Are you sure you want to delete <strong>{session.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
