import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Debounce helper to prevent thundering-herd refetches
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
function debouncedRefetch<T>(key: string, fn: () => Promise<T>, callback: (result: T) => void, delayMs = 300) {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(key, setTimeout(async () => {
    debounceTimers.delete(key);
    try {
      const result = await fn();
      callback(result);
    } catch (e) {
      console.error(`[gameService] debounced refetch failed for ${key}:`, e);
    }
  }, delayMs));
}

export interface LiveGame {
  id: string;
  sessionId: string;
  status: 'lobby' | 'playing' | 'ended';
  startedAt?: string;
  endsAt?: string;
  team1Score: number;
  team2Score: number;
  createdAt: string;
  updatedAt: string;
}

export interface GamePlayer {
  id: string;
  liveGameId: string;
  playerName: string;
  team: 'team1' | 'team2' | null;
  score: number;
  territoriesClaimed: number;
  questionsAnswered: number;
  correctAnswers: number;
  connected: boolean;
  joinedAt: string;
  lastActive: string;
}

export interface HexTerritory {
  id: string;
  liveGameId: string;
  hexId: string;
  owner: 'team1' | 'team2';
  claimedBy?: string;
  claimedAt: string;
}

export const gameService = {
  async createLiveGame(sessionId: string): Promise<LiveGame | null> {
    try {
      const { data, error } = await supabase
        .from('live_games')
        .insert({
          session_id: sessionId,
          status: 'lobby',
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapDbToLiveGame(data);
    } catch (error) {
      console.error('Failed to create live game:', error);
      return null;
    }
  },

  async getLiveGame(gameId: string): Promise<LiveGame | null> {
    try {
      const { data, error } = await supabase
        .from('live_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      return this.mapDbToLiveGame(data);
    } catch {
      return null;
    }
  },

  async getLiveGameBySessionId(sessionId: string): Promise<LiveGame | null> {
    try {
      const { data, error } = await supabase
        .from('live_games')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return this.mapDbToLiveGame(data);
    } catch {
      return null;
    }
  },

  async startGame(gameId: string, duration: number): Promise<boolean> {
    try {
      const now = new Date();
      const endsAt = new Date(now.getTime() + duration * 1000);

      const { error } = await supabase
        .from('live_games')
        .update({
          status: 'playing',
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', gameId);

      return !error;
    } catch {
      return false;
    }
  },

  async endGame(gameId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('live_games')
        .update({
          status: 'ended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      return !error;
    } catch {
      return false;
    }
  },

  async resetGame(gameId: string): Promise<boolean> {
    try {
      const oldGame = await this.getLiveGame(gameId);
      if (!oldGame) return false;

      const { error: territoriesError } = await supabase
        .from('hex_territories')
        .delete()
        .eq('live_game_id', gameId);

      if (territoriesError) {
        console.error('Failed to delete territories:', territoriesError);
      }

      const { error: playersError } = await supabase
        .from('game_players')
        .delete()
        .eq('live_game_id', gameId);

      if (playersError) {
        console.error('Failed to delete players:', playersError);
        return false;
      }

      const { error: deleteGameError } = await supabase
        .from('live_games')
        .delete()
        .eq('id', gameId);

      if (deleteGameError) {
        console.error('Failed to delete old game:', deleteGameError);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: newGame, error: createError } = await supabase
        .from('live_games')
        .insert({
          session_id: oldGame.sessionId,
          status: 'lobby',
          team1_score: 0,
          team2_score: 0,
        })
        .select()
        .single();

      if (createError || !newGame) {
        console.error('Failed to create new game:', createError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to reset game:', error);
      return false;
    }
  },

  async updateScore(gameId: string, team: 'team1' | 'team2', points: number): Promise<boolean> {
    try {
      // Atomic increment via rpc to avoid read-then-write race conditions
      const column = team === 'team1' ? 'team1_score' : 'team2_score';
      const { error } = await supabase.rpc('increment_game_score', {
        game_id: gameId,
        score_column: column,
        increment_by: points,
      });

      // Fallback to direct update if rpc doesn't exist yet
      if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
        const game = await this.getLiveGame(gameId);
        if (!game) return false;
        const newScore = team === 'team1'
          ? { team1_score: game.team1Score + points }
          : { team2_score: game.team2Score + points };
        const { error: updateError } = await supabase
          .from('live_games')
          .update({ ...newScore, updated_at: new Date().toISOString() })
          .eq('id', gameId);
        return !updateError;
      }

      return !error;
    } catch {
      return false;
    }
  },

  async addPlayer(
    gameId: string,
    playerName: string,
    team: 'team1' | 'team2' | null,
    registrationData?: {
      email?: string;
      organization?: string;
      customFields?: Record<string, string>;
    }
  ): Promise<GamePlayer | null> {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .insert({
          live_game_id: gameId,
          player_name: playerName,
          team,
          email: registrationData?.email || null,
          organization: registrationData?.organization || null,
          custom_fields: registrationData?.customFields || {},
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapDbToGamePlayer(data);
    } catch (error) {
      console.error('[gameService] addPlayer failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  },

  async getPlayers(gameId: string): Promise<GamePlayer[]> {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('live_game_id', gameId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data.map((p) => this.mapDbToGamePlayer(p));
    } catch {
      return [];
    }
  },

  async updatePlayerStats(
    playerId: string,
    updates: {
      questionsAnswered?: number;
      correctAnswers?: number;
      territoriesClaimed?: number;
    }
  ): Promise<boolean> {
    try {
      // Atomic increment via rpc to avoid read-then-write race conditions
      const { error } = await supabase.rpc('increment_player_stats', {
        player_id: playerId,
        add_questions: updates.questionsAnswered || 0,
        add_correct: updates.correctAnswers || 0,
        add_territories: updates.territoriesClaimed || 0,
      });

      // Fallback to read-then-write if rpc doesn't exist yet
      if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
        const { data: player } = await supabase
          .from('game_players')
          .select('*')
          .eq('id', playerId)
          .single();
        if (!player) return false;
        const { error: updateError } = await supabase
          .from('game_players')
          .update({
            questions_answered: player.questions_answered + (updates.questionsAnswered || 0),
            correct_answers: player.correct_answers + (updates.correctAnswers || 0),
            territories_claimed: player.territories_claimed + (updates.territoriesClaimed || 0),
            last_active: new Date().toISOString(),
          })
          .eq('id', playerId);
        return !updateError;
      }

      return !error;
    } catch {
      return false;
    }
  },

  async claimTerritory(
    gameId: string,
    hexId: string,
    owner: 'team1' | 'team2',
    claimedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('hex_territories')
        .insert({
          live_game_id: gameId,
          hex_id: hexId,
          team: owner,
          claimed_by_player_id: claimedBy,
        });

      if (error) throw error;

      await this.updateScore(gameId, owner, 1);
      await this.updatePlayerStats(claimedBy, { territoriesClaimed: 1 });

      return true;
    } catch (error) {
      console.error('Failed to claim territory:', error);
      return false;
    }
  },

  async getTerritories(gameId: string): Promise<HexTerritory[]> {
    try {
      const { data, error } = await supabase
        .from('hex_territories')
        .select('*')
        .eq('live_game_id', gameId);

      if (error) throw error;
      return data.map((t) => this.mapDbToHexTerritory(t));
    } catch {
      return [];
    }
  },

  async updatePlayerConnection(playerId: string, connected: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_players')
        .update({
          connected,
          last_active: new Date().toISOString(),
        })
        .eq('id', playerId);

      return !error;
    } catch {
      return false;
    }
  },

  async removePlayer(playerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_players')
        .delete()
        .eq('id', playerId);
      return !error;
    } catch {
      return false;
    }
  },

  async getGameBySessionId(sessionId: string): Promise<LiveGame | null> {
    try {
      const { data, error } = await supabase
        .from('live_games')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return this.mapDbToLiveGame(data);
    } catch {
      return null;
    }
  },

  subscribeToGame(
    gameId: string,
    onUpdate: (game: LiveGame) => void,
    onDelete?: () => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (onDelete) onDelete();
          } else if (payload.new) {
            onUpdate(this.mapDbToLiveGame(payload.new as any));
          }
        }
      )
      .subscribe();

    return channel;
  },

  subscribeToPlayers(
    gameId: string,
    onUpdate: (players: GamePlayer[]) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`players:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `live_game_id=eq.${gameId}`,
        },
        () => {
          // Debounce: batch rapid player changes into one refetch
          debouncedRefetch(
            `players:${gameId}`,
            () => this.getPlayers(gameId),
            onUpdate,
            500
          );
        }
      )
      .subscribe();

    return channel;
  },

  subscribeToTerritories(
    gameId: string,
    onUpdate: (territories: HexTerritory[]) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`territories:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hex_territories',
          filter: `live_game_id=eq.${gameId}`,
        },
        () => {
          // Debounce: batch rapid territory changes into one refetch
          debouncedRefetch(
            `territories:${gameId}`,
            () => this.getTerritories(gameId),
            onUpdate,
            500
          );
        }
      )
      .subscribe();

    return channel;
  },

  mapDbToLiveGame(data: any): LiveGame {
    return {
      id: data.id,
      sessionId: data.session_id,
      status: data.status,
      startedAt: data.started_at,
      endsAt: data.ends_at,
      team1Score: data.team1_score,
      team2Score: data.team2_score,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  mapDbToGamePlayer(data: any): GamePlayer {
    return {
      id: data.id,
      liveGameId: data.live_game_id,
      playerName: data.player_name,
      team: data.team,
      score: data.score,
      territoriesClaimed: data.territories_claimed,
      questionsAnswered: data.questions_answered,
      correctAnswers: data.correct_answers,
      connected: data.connected,
      joinedAt: data.joined_at,
      lastActive: data.last_active,
    };
  },

  mapDbToHexTerritory(data: any): HexTerritory {
    return {
      id: data.id,
      liveGameId: data.live_game_id,
      hexId: data.hex_id,
      owner: data.team,
      claimedBy: data.claimed_by_player_id,
      claimedAt: data.claimed_at,
    };
  },
};
