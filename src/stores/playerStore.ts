import { create } from 'zustand';
import type { GamePlayer } from '../services/gameService';

interface PlayerState {
  playerId: string | null;
  playerName: string | null;
  gameId: string | null;
  team: 'team1' | 'team2' | null;
  playerData: GamePlayer | null;
  setPlayer: (playerId: string, playerName: string, gameId: string, team: 'team1' | 'team2') => void;
  setPlayerData: (data: GamePlayer) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  playerId: null,
  playerName: null,
  gameId: null,
  team: null,
  playerData: null,
  setPlayer: (playerId, playerName, gameId, team) =>
    set({ playerId, playerName, gameId, team }),
  setPlayerData: (data) => set({ playerData: data }),
  clearPlayer: () =>
    set({ playerId: null, playerName: null, gameId: null, team: null, playerData: null }),
}));
