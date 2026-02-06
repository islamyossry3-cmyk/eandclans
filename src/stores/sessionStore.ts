import { create } from 'zustand';
import { sessionService } from '../services/sessionService';
import type { Session } from '../types/session';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  fetchSessions: (adminId: string) => Promise<void>;
  createSession: (adminId: string, data: Partial<Session>) => Promise<Session | null>;
  updateSession: (sessionId: string, data: Partial<Session>) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  duplicateSession: (sessionId: string, adminId: string) => Promise<boolean>;
  setCurrentSession: (session: Session | null) => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  fetchSessions: async (adminId: string) => {
    set({ isLoading: true, error: null });
    const allSessions = await sessionService.getSessionsByAdmin(adminId);
    // Filter out auto-generated tournament sessions
    const sessions = allSessions.filter(s => !s.name.startsWith('tournament-'));
    set({ sessions, isLoading: false });
  },

  createSession: async (adminId: string, data: Partial<Session>) => {
    set({ isLoading: true, error: null });
    const result = await sessionService.createSession(adminId, data);

    if (result.success && result.session) {
      const sessions = await sessionService.getSessionsByAdmin(adminId);
      set({ sessions, isLoading: false });
      return result.session;
    } else {
      set({ error: result.error || 'Failed to create session', isLoading: false });
      return null;
    }
  },

  updateSession: async (sessionId: string, data: Partial<Session>) => {
    set({ isLoading: true, error: null });
    const result = await sessionService.updateSession(sessionId, data);

    if (result.success) {
      const { sessions } = get();
      const updatedSessions = sessions.map((s) =>
        s.id === sessionId ? result.session! : s
      );
      set({ sessions: updatedSessions, isLoading: false });
      return true;
    } else {
      set({ error: result.error || 'Failed to update session', isLoading: false });
      return false;
    }
  },

  deleteSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    const result = await sessionService.deleteSession(sessionId);

    if (result.success) {
      const { sessions } = get();
      const filteredSessions = sessions.filter((s) => s.id !== sessionId);
      set({ sessions: filteredSessions, isLoading: false });
      return true;
    } else {
      set({ error: result.error || 'Failed to delete session', isLoading: false });
      return false;
    }
  },

  duplicateSession: async (sessionId: string, adminId: string) => {
    set({ isLoading: true, error: null });
    const result = await sessionService.duplicateSession(sessionId, adminId);

    if (result.success) {
      const sessions = await sessionService.getSessionsByAdmin(adminId);
      set({ sessions, isLoading: false });
      return true;
    } else {
      set({ error: result.error || 'Failed to duplicate session', isLoading: false });
      return false;
    }
  },

  setCurrentSession: (session: Session | null) => {
    set({ currentSession: session });
  },

  clearError: () => set({ error: null }),
}));
