import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Tournament {
  id: string;
  adminId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  sessionDurationSeconds: number;
  breakDurationSeconds: number;
  maxPlayersPerSession: number;
  maxPlayersPerTeam: number;
  status: 'scheduled' | 'active' | 'paused' | 'completed';
  questionBankId?: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentSession {
  id: string;
  tournamentId: string;
  sessionNumber: number;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'pending' | 'active' | 'completed';
  team1FinalScore: number;
  team2FinalScore: number;
  winner?: 'team1' | 'team2' | 'tie';
  createdAt: string;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  playerName: string;
  email?: string;
  preferredLanguage: 'en' | 'ar';
  totalCredits: number;
  totalCorrectAnswers: number;
  totalTerritoriesClaimed: number;
  sessionsPlayed: number;
  createdAt: string;
  updatedAt: string;
}

export const tournamentService = {
  // Tournament CRUD
  async createTournament(data: {
    adminId: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    sessionDurationSeconds?: number;
    breakDurationSeconds?: number;
    maxPlayersPerSession?: number;
    maxPlayersPerTeam?: number;
    questionBankId?: string;
    config?: Record<string, any>;
  }): Promise<Tournament | null> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          admin_id: data.adminId,
          name: data.name,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          session_duration_seconds: data.sessionDurationSeconds || 480,
          break_duration_seconds: data.breakDurationSeconds || 120,
          max_players_per_session: data.maxPlayersPerSession || 50,
          max_players_per_team: data.maxPlayersPerTeam || 25,
          question_bank_id: data.questionBankId,
          config: data.config || {},
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapDbToTournament(tournament);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      return null;
    }
  },

  async getTournament(id: string): Promise<Tournament | null> {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.mapDbToTournament(data);
    } catch {
      return null;
    }
  },

  async getTournamentsByAdmin(adminId: string): Promise<Tournament[]> {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((t) => this.mapDbToTournament(t));
    } catch {
      return [];
    }
  },

  async getActiveTournaments(): Promise<Tournament[]> {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data.map((t) => this.mapDbToTournament(t));
    } catch {
      return [];
    }
  },

  async updateTournament(id: string, updates: Partial<{
    name: string;
    description: string;
    status: 'scheduled' | 'active' | 'paused' | 'completed';
    config: Record<string, any>;
  }>): Promise<boolean> {
    try {
      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.config) dbUpdates.config = updates.config;

      const { error } = await supabase
        .from('tournaments')
        .update(dbUpdates)
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  async deleteTournament(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  // Tournament Sessions
  async createTournamentSession(data: {
    tournamentId: string;
    sessionNumber: number;
    scheduledStart: string;
    scheduledEnd: string;
  }): Promise<TournamentSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('tournament_sessions')
        .insert({
          tournament_id: data.tournamentId,
          session_number: data.sessionNumber,
          scheduled_start: data.scheduledStart,
          scheduled_end: data.scheduledEnd,
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapDbToTournamentSession(session);
    } catch (error) {
      console.error('Failed to create tournament session:', error);
      return null;
    }
  },

  async getTournamentSessions(tournamentId: string): Promise<TournamentSession[]> {
    try {
      const { data, error } = await supabase
        .from('tournament_sessions')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('session_number', { ascending: true });

      if (error) throw error;
      return data.map((s) => this.mapDbToTournamentSession(s));
    } catch {
      return [];
    }
  },

  async getCurrentSession(tournamentId: string): Promise<TournamentSession | null> {
    try {
      const { data, error } = await supabase
        .from('tournament_sessions')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'active')
        .single();

      if (error) return null;
      return this.mapDbToTournamentSession(data);
    } catch {
      return null;
    }
  },

  async updateSessionStatus(
    sessionId: string,
    status: 'pending' | 'active' | 'completed',
    scores?: { team1: number; team2: number }
  ): Promise<boolean> {
    try {
      const updates: Record<string, any> = { status };
      
      if (status === 'active') {
        updates.actual_start = new Date().toISOString();
      } else if (status === 'completed') {
        updates.actual_end = new Date().toISOString();
        if (scores) {
          updates.team1_final_score = scores.team1;
          updates.team2_final_score = scores.team2;
          updates.winner = scores.team1 > scores.team2 ? 'team1' 
            : scores.team2 > scores.team1 ? 'team2' 
            : 'tie';
        }
      }

      const { error } = await supabase
        .from('tournament_sessions')
        .update(updates)
        .eq('id', sessionId);

      return !error;
    } catch {
      return false;
    }
  },

  // Tournament Players
  async registerPlayer(data: {
    tournamentId: string;
    playerName: string;
    email?: string;
    preferredLanguage?: 'en' | 'ar';
  }): Promise<TournamentPlayer | null> {
    try {
      const { data: player, error } = await supabase
        .from('tournament_players')
        .insert({
          tournament_id: data.tournamentId,
          player_name: data.playerName,
          email: data.email,
          preferred_language: data.preferredLanguage || 'en',
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapDbToTournamentPlayer(player);
    } catch (error) {
      console.error('Failed to register tournament player:', error);
      return null;
    }
  },

  async getPlayer(tournamentId: string, playerName: string): Promise<TournamentPlayer | null> {
    try {
      const { data, error } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_name', playerName)
        .single();

      if (error) return null;
      return this.mapDbToTournamentPlayer(data);
    } catch {
      return null;
    }
  },

  async getTournamentPlayers(tournamentId: string): Promise<TournamentPlayer[]> {
    try {
      const { data, error } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('total_credits', { ascending: false });

      if (error) throw error;
      return data.map((p) => this.mapDbToTournamentPlayer(p));
    } catch {
      return [];
    }
  },

  async updatePlayerStats(
    playerId: string,
    updates: {
      creditsToAdd?: number;
      correctAnswersToAdd?: number;
      territoriesClaimedToAdd?: number;
      incrementSessionsPlayed?: boolean;
    }
  ): Promise<boolean> {
    try {
      const { data: player } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (!player) return false;

      const newStats: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.creditsToAdd) {
        newStats.total_credits = player.total_credits + updates.creditsToAdd;
      }
      if (updates.correctAnswersToAdd) {
        newStats.total_correct_answers = player.total_correct_answers + updates.correctAnswersToAdd;
      }
      if (updates.territoriesClaimedToAdd) {
        newStats.total_territories_claimed = player.total_territories_claimed + updates.territoriesClaimedToAdd;
      }
      if (updates.incrementSessionsPlayed) {
        newStats.sessions_played = player.sessions_played + 1;
      }

      const { error } = await supabase
        .from('tournament_players')
        .update(newStats)
        .eq('id', playerId);

      return !error;
    } catch {
      return false;
    }
  },

  // Credit System (3 correct = 1 credit)
  async addCorrectAnswer(playerId: string): Promise<{ newCredits: number; creditEarned: boolean }> {
    try {
      const { data: player } = await supabase
        .from('tournament_players')
        .select('total_correct_answers, total_credits')
        .eq('id', playerId)
        .single();

      if (!player) return { newCredits: 0, creditEarned: false };

      const newCorrectAnswers = player.total_correct_answers + 1;
      const creditEarned = newCorrectAnswers % 3 === 0;
      const newCredits = creditEarned ? player.total_credits + 1 : player.total_credits;

      await supabase
        .from('tournament_players')
        .update({
          total_correct_answers: newCorrectAnswers,
          total_credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playerId);

      return { newCredits, creditEarned };
    } catch {
      return { newCredits: 0, creditEarned: false };
    }
  },

  // Realtime subscriptions
  subscribeToTournament(
    tournamentId: string,
    onUpdate: (tournament: Tournament) => void
  ): RealtimeChannel {
    return supabase
      .channel(`tournament:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(this.mapDbToTournament(payload.new as any));
          }
        }
      )
      .subscribe();
  },

  subscribeToTournamentSessions(
    tournamentId: string,
    onUpdate: (sessions: TournamentSession[]) => void
  ): RealtimeChannel {
    return supabase
      .channel(`tournament_sessions:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_sessions',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async () => {
          const sessions = await this.getTournamentSessions(tournamentId);
          onUpdate(sessions);
        }
      )
      .subscribe();
  },

  subscribeToTournamentPlayers(
    tournamentId: string,
    onUpdate: (players: TournamentPlayer[]) => void
  ): RealtimeChannel {
    return supabase
      .channel(`tournament_players:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_players',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async () => {
          const players = await this.getTournamentPlayers(tournamentId);
          onUpdate(players);
        }
      )
      .subscribe();
  },

  // Mappers
  mapDbToTournament(data: any): Tournament {
    return {
      id: data.id,
      adminId: data.admin_id,
      name: data.name,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      sessionDurationSeconds: data.session_duration_seconds,
      breakDurationSeconds: data.break_duration_seconds,
      maxPlayersPerSession: data.max_players_per_session,
      maxPlayersPerTeam: data.max_players_per_team,
      status: data.status,
      questionBankId: data.question_bank_id,
      config: data.config,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  mapDbToTournamentSession(data: any): TournamentSession {
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      sessionNumber: data.session_number,
      scheduledStart: data.scheduled_start,
      scheduledEnd: data.scheduled_end,
      actualStart: data.actual_start,
      actualEnd: data.actual_end,
      status: data.status,
      team1FinalScore: data.team1_final_score,
      team2FinalScore: data.team2_final_score,
      winner: data.winner,
      createdAt: data.created_at,
    };
  },

  mapDbToTournamentPlayer(data: any): TournamentPlayer {
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      playerName: data.player_name,
      email: data.email,
      preferredLanguage: data.preferred_language,
      totalCredits: data.total_credits,
      totalCorrectAnswers: data.total_correct_answers,
      totalTerritoriesClaimed: data.total_territories_claimed,
      sessionsPlayed: data.sessions_played,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};
