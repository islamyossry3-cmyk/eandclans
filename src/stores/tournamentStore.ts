import { create } from 'zustand';
import type { Tournament, TournamentSession, TournamentPlayer } from '../services/tournamentService';

interface TournamentState {
  // Current tournament context
  currentTournament: Tournament | null;
  currentSession: TournamentSession | null;
  sessions: TournamentSession[];
  players: TournamentPlayer[];
  
  // Player context (for player view)
  currentPlayer: TournamentPlayer | null;
  playerCredits: number;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentTournament: (tournament: Tournament | null) => void;
  setCurrentSession: (session: TournamentSession | null) => void;
  setSessions: (sessions: TournamentSession[]) => void;
  setPlayers: (players: TournamentPlayer[]) => void;
  setCurrentPlayer: (player: TournamentPlayer | null) => void;
  updatePlayerCredits: (credits: number) => void;
  addCredit: () => void;
  useCredit: () => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentTournament: null,
  currentSession: null,
  sessions: [],
  players: [],
  currentPlayer: null,
  playerCredits: 0,
  isLoading: false,
  error: null,
};

export const useTournamentStore = create<TournamentState>((set, get) => ({
  ...initialState,

  setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
  
  setCurrentSession: (session) => set({ currentSession: session }),
  
  setSessions: (sessions) => set({ sessions }),
  
  setPlayers: (players) => set({ players }),
  
  setCurrentPlayer: (player) => set({ 
    currentPlayer: player,
    playerCredits: player?.totalCredits || 0,
  }),
  
  updatePlayerCredits: (credits) => set({ playerCredits: credits }),
  
  addCredit: () => set((state) => ({ 
    playerCredits: state.playerCredits + 1 
  })),
  
  useCredit: () => {
    const { playerCredits } = get();
    if (playerCredits > 0) {
      set({ playerCredits: playerCredits - 1 });
      return true;
    }
    return false;
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}));

// Selectors
export const selectTournamentLeaderboard = (state: TournamentState) => 
  [...state.players].sort((a, b) => b.totalCredits - a.totalCredits);

export const selectSessionsCompleted = (state: TournamentState) =>
  state.sessions.filter(s => s.status === 'completed').length;

export const selectNextSession = (state: TournamentState) =>
  state.sessions.find(s => s.status === 'pending');

export const selectTournamentProgress = (state: TournamentState) => {
  if (!state.currentTournament) return 0;
  
  const now = new Date();
  const start = new Date(state.currentTournament.startDate);
  const end = new Date(state.currentTournament.endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / total) * 100);
};
