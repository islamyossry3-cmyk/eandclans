import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Debounce helper to prevent thundering-herd refetches
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
function debouncedRefetch<T>(key: string, fn: () => Promise<T>, callback: (result: T) => void, delayMs = 500) {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(key, setTimeout(async () => {
    debounceTimers.delete(key);
    try {
      const result = await fn();
      callback(result);
    } catch (e) {
      console.error(`[tournamentService] debounced refetch failed for ${key}:`, e);
    }
  }, delayMs));
}

export interface TournamentQuestion {
  id: string;
  text: string;
  textAr?: string;
  options: Array<{ id: string; text: string; textAr?: string }>;
  correctAnswer: string;
  timeLimit?: number;
  points?: number;
  category?: string;
}

export interface TournamentTeamDesign {
  name: string;
  color: string;
  icon: string;
}

export interface TournamentDesign {
  team1: TournamentTeamDesign;
  team2: TournamentTeamDesign;
  backgroundTheme: string;
  customBackgroundUrl?: string;
  brandingText?: string;
  backgroundMusicUrl?: string;
  pointsPerCorrectAnswer: number;
  timePerQuestion: number;
  hexGridSize: number;
}

export const defaultTournamentDesign: TournamentDesign = {
  team1: { name: 'Team 1', color: '#E00800', icon: '🔴' },
  team2: { name: 'Team 2', color: '#003DA5', icon: '🔵' },
  backgroundTheme: 'win-together',
  brandingText: '',
  pointsPerCorrectAnswer: 10,
  timePerQuestion: 15,
  hexGridSize: 18,
};

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
  activeHoursStart?: string;
  activeHoursEnd?: string;
  excludedDays?: number[];
  status: 'scheduled' | 'active' | 'paused' | 'completed';
  questionBankId?: string;
  questions: TournamentQuestion[];
  design: TournamentDesign;
  config: Record<string, unknown>;
  postGameFileUrl?: string;
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
  liveGameId?: string;
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
    activeHoursStart?: string;
    activeHoursEnd?: string;
    excludedDays?: number[];
    questionBankId?: string;
    questions?: TournamentQuestion[];
    design?: TournamentDesign;
    config?: Record<string, unknown>;
    postGameFileUrl?: string;
  }): Promise<Tournament | null> {
    try {
      const config = {
        ...(data.config || {}),
        activeHoursStart: data.activeHoursStart,
        activeHoursEnd: data.activeHoursEnd,
        excludedDays: data.excludedDays || [],
      };
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
          questions: data.questions || [],
          design: data.design || defaultTournamentDesign,
          config,
          post_game_file_url: data.postGameFileUrl,
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
    questions: TournamentQuestion[];
    design: TournamentDesign;
    config: Record<string, unknown>;
  }>): Promise<boolean> {
    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.questions) dbUpdates.questions = updates.questions;
      if (updates.design) dbUpdates.design = updates.design;
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
  async generateTournamentSessions(tournament: Tournament): Promise<TournamentSession[]> {
    const sessions: TournamentSession[] = [];
    const startTime = new Date(tournament.startDate).getTime();
    const endTime = new Date(tournament.endDate).getTime();
    const sessionDuration = tournament.sessionDurationSeconds * 1000;
    const breakDuration = tournament.breakDurationSeconds * 1000;
    const cycleDuration = sessionDuration + breakDuration;

    let sessionNumber = 1;
    let currentTime = startTime;

    while (currentTime + sessionDuration <= endTime) {
      const scheduledStart = new Date(currentTime).toISOString();
      const scheduledEnd = new Date(currentTime + sessionDuration).toISOString();

      const session = await this.createTournamentSession({
        tournamentId: tournament.id,
        sessionNumber,
        scheduledStart,
        scheduledEnd,
      });

      if (session) {
        sessions.push(session);
      }

      sessionNumber++;
      currentTime += cycleDuration;
    }

    return sessions;
  },

  async startTournament(tournamentId: string): Promise<boolean> {
    try {
      // Get tournament
      const tournament = await this.getTournament(tournamentId);
      if (!tournament) return false;

      // Generate sessions if none exist
      const existingSessions = await this.getTournamentSessions(tournamentId);
      if (existingSessions.length === 0) {
        await this.generateTournamentSessions(tournament);
      }

      // Update tournament status
      await this.updateTournament(tournamentId, { status: 'active' });

      // Start first session
      const sessions = await this.getTournamentSessions(tournamentId);
      const firstPending = sessions.find(s => s.status === 'pending');
      if (firstPending) {
        await this.activateSession(firstPending.id);
      }

      return true;
    } catch (error) {
      console.error('Failed to start tournament:', error);
      return false;
    }
  },

  async activateSession(sessionId: string, liveGameId?: string): Promise<boolean> {
    try {
      const updates: Record<string, unknown> = {
        status: 'active',
        actual_start: new Date().toISOString(),
      };
      
      if (liveGameId) {
        updates.live_game_id = liveGameId;
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

  async linkSessionToGame(sessionId: string, liveGameId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tournament_sessions')
        .update({ live_game_id: liveGameId })
        .eq('id', sessionId);

      return !error;
    } catch {
      return false;
    }
  },

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
        .maybeSingle();

      if (error || !data) return null;
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
      const { error } = await supabase.rpc('increment_tournament_player_stats', {
        player_id: playerId,
        add_correct: updates.correctAnswersToAdd || 0,
        add_credits: updates.creditsToAdd || 0,
        add_territories: updates.territoriesClaimedToAdd || 0,
        add_sessions: updates.incrementSessionsPlayed ? 1 : 0,
      });

      if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
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

        const { error: updateError } = await supabase
          .from('tournament_players')
          .update(newStats)
          .eq('id', playerId);

        return !updateError;
      }

      return !error;
    } catch {
      return false;
    }
  },

  // Credit System (3 correct = 1 credit)
  async addCorrectAnswer(playerId: string): Promise<{ newCredits: number; creditEarned: boolean }> {
    try {
      const { data, error } = await supabase.rpc('increment_tournament_player_stats', {
        player_id: playerId,
        add_correct: 1,
        add_credits: 0,
        add_territories: 0,
        add_sessions: 0,
      });

      if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
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
      }

      if (error) return { newCredits: 0, creditEarned: false };

      const row = Array.isArray(data) ? data[0] : data;
      return {
        newCredits: row?.total_credits ?? 0,
        creditEarned: row?.credit_earned ?? false,
      };
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
        () => {
          debouncedRefetch(
            `tsessions:${tournamentId}`,
            () => this.getTournamentSessions(tournamentId),
            onUpdate,
            500
          );
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
        () => {
          debouncedRefetch(
            `tplayers:${tournamentId}`,
            () => this.getTournamentPlayers(tournamentId),
            onUpdate,
            800
          );
        }
      )
      .subscribe();
  },

  // Mappers
  mapDbToTournament(data: Record<string, unknown>): Tournament {
    const config = (data.config || {}) as Record<string, unknown>;
    return {
      id: data.id as string,
      adminId: data.admin_id as string,
      name: data.name as string,
      description: data.description as string | undefined,
      startDate: data.start_date as string,
      endDate: data.end_date as string,
      sessionDurationSeconds: data.session_duration_seconds as number,
      breakDurationSeconds: data.break_duration_seconds as number,
      maxPlayersPerSession: data.max_players_per_session as number,
      maxPlayersPerTeam: data.max_players_per_team as number,
      activeHoursStart: config.activeHoursStart as string | undefined,
      activeHoursEnd: config.activeHoursEnd as string | undefined,
      excludedDays: (config.excludedDays as number[] | undefined) || [],
      status: data.status as Tournament['status'],
      questionBankId: data.question_bank_id as string | undefined,
      questions: (data.questions as TournamentQuestion[]) || [],
      design: (data.design as TournamentDesign) || defaultTournamentDesign,
      config,
      postGameFileUrl: data.post_game_file_url as string | undefined,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  },

  mapDbToTournamentSession(data: Record<string, unknown>): TournamentSession {
    return {
      id: data.id as string,
      tournamentId: data.tournament_id as string,
      sessionNumber: data.session_number as number,
      scheduledStart: data.scheduled_start as string,
      scheduledEnd: data.scheduled_end as string,
      actualStart: data.actual_start as string | undefined,
      actualEnd: data.actual_end as string | undefined,
      status: data.status as 'pending' | 'active' | 'completed',
      team1FinalScore: data.team1_final_score as number,
      team2FinalScore: data.team2_final_score as number,
      winner: data.winner as 'team1' | 'team2' | 'tie' | undefined,
      liveGameId: data.live_game_id as string | undefined,
      createdAt: data.created_at as string,
    };
  },

  mapDbToTournamentPlayer(data: Record<string, unknown>): TournamentPlayer {
    return {
      id: data.id as string,
      tournamentId: data.tournament_id as string,
      playerName: data.player_name as string,
      email: data.email as string | undefined,
      preferredLanguage: data.preferred_language as 'en' | 'ar',
      totalCredits: data.total_credits as number,
      totalCorrectAnswers: data.total_correct_answers as number,
      totalTerritoriesClaimed: data.total_territories_claimed as number,
      sessionsPlayed: data.sessions_played as number,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  },
};
