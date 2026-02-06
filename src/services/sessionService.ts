import { supabase } from '../lib/supabase';
import type { Session } from '../types/session';

type DbRow = Record<string, unknown>;

function generateSessionPin(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

export const sessionService = {
  async createSession(adminId: string, data: Partial<Session>): Promise<{ success: boolean; session?: Session; error?: string }> {
    try {
      const sessionPin = generateSessionPin();
      const qrCodeData = `${window.location.origin}/join/${sessionPin}`;

      const sessionData = {
        admin_id: adminId,
        name: data.name,
        description: data.description,
        type: data.type || 'team_battle',
        status: 'draft',
        session_pin: sessionPin,
        qr_code_data: qrCodeData,
        config_duration: data.config?.duration || 1800,
        config_max_players_per_team: data.config?.maxPlayersPerTeam || 10,
        config_hex_grid_size: data.config?.hexGridSize || 37,
        config_time_per_question: data.config?.timePerQuestion || 15,
        config_points_per_correct_answer: data.config?.pointsPerCorrectAnswer || 10,
        config_allow_skip: data.config?.allowSkip || false,
        design_team1_name: data.design?.team1.name || 'Team 1',
        design_team1_color: data.design?.team1.color || '#E00800',
        design_team1_icon: data.design?.team1.icon || '🏰',
        design_team2_name: data.design?.team2.name || 'Team 2',
        design_team2_color: data.design?.team2.color || '#47CB6C',
        design_team2_icon: data.design?.team2.icon || '🏯',
        design_background_theme: data.design?.backgroundTheme || 'win-together',
        design_custom_background_url: data.design?.customBackgroundUrl,
        design_logo_url: data.design?.logoUrl,
        design_branding_text: data.design?.brandingText,
        questions: JSON.stringify(data.questions || []),
        post_game_file_url: data.postGameFileUrl,
        background_music_url: data.backgroundMusicUrl,
        auto_restart: data.autoRestart,
        restart_delay: data.restartDelay,
      };

      const { data: createdSession, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, session: this.mapDbToSession(createdSession) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
      };
    }
  },

  async updateSession(sessionId: string, data: Partial<Session>): Promise<{ success: boolean; session?: Session; error?: string }> {
    try {
      const updateData: Record<string, unknown> = {
        name: data.name,
        description: data.description,
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      if (data.config) {
        updateData.config_duration = data.config.duration;
        updateData.config_max_players_per_team = data.config.maxPlayersPerTeam;
        updateData.config_hex_grid_size = data.config.hexGridSize;
        updateData.config_time_per_question = data.config.timePerQuestion;
        updateData.config_points_per_correct_answer = data.config.pointsPerCorrectAnswer;
        updateData.config_allow_skip = data.config.allowSkip;
      }

      if (data.design) {
        updateData.design_team1_name = data.design.team1.name;
        updateData.design_team1_color = data.design.team1.color;
        updateData.design_team1_icon = data.design.team1.icon;
        updateData.design_team2_name = data.design.team2.name;
        updateData.design_team2_color = data.design.team2.color;
        updateData.design_team2_icon = data.design.team2.icon;
        updateData.design_background_theme = data.design.backgroundTheme;
        updateData.design_custom_background_url = data.design.customBackgroundUrl;
        updateData.design_logo_url = data.design.logoUrl;
        updateData.design_branding_text = data.design.brandingText;
      }

      if (data.questions) {
        updateData.questions = JSON.stringify(data.questions);
      }

      if (data.postGameFileUrl !== undefined) {
        updateData.post_game_file_url = data.postGameFileUrl;
      }

      if (data.backgroundMusicUrl !== undefined) {
        updateData.background_music_url = data.backgroundMusicUrl;
      }

      if (data.autoRestart !== undefined) {
        updateData.auto_restart = data.autoRestart;
      }

      if (data.restartDelay !== undefined) {
        updateData.restart_delay = data.restartDelay;
      }

      const { data: updatedSession, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, session: this.mapDbToSession(updatedSession) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session',
      };
    }
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session',
      };
    }
  },

  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      return this.mapDbToSession(data);
    } catch {
      return null;
    }
  },

  async getSessionByPin(sessionPin: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_pin', sessionPin)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return this.mapDbToSession(data);
    } catch {
      return null;
    }
  },

  async getSessionsByAdmin(adminId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((session) => this.mapDbToSession(session));
    } catch {
      return [];
    }
  },

  async duplicateSession(sessionId: string, adminId: string): Promise<{ success: boolean; session?: Session; error?: string }> {
    try {
      const original = await this.getSession(sessionId);
      if (!original) throw new Error('Session not found');

      const duplicateData = {
        ...original,
        name: `${original.name} (Copy)`,
        status: 'draft' as const,
      };

      return await this.createSession(adminId, duplicateData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to duplicate session',
      };
    }
  },

  subscribeToSession(sessionId: string, onUpdate: (session: Session) => void) {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updatedSession = this.mapDbToSession(payload.new);
          onUpdate(updatedSession);
        }
      )
      .subscribe();

    return channel;
  },

  mapDbToSession(dbSession: DbRow): Session {
    const questionsValue = dbSession.questions;
    const parsedQuestions = typeof questionsValue === 'string'
      ? JSON.parse(questionsValue)
      : questionsValue;

    return {
      id: dbSession.id as string,
      adminId: dbSession.admin_id as string,
      name: dbSession.name as string,
      description: dbSession.description as string | undefined,
      type: dbSession.type as Session['type'],
      status: dbSession.status as Session['status'],
      sessionPin: dbSession.session_pin as string,
      qrCodeData: dbSession.qr_code_data as string | undefined,
      config: {
        duration: dbSession.config_duration as number,
        maxPlayersPerTeam: dbSession.config_max_players_per_team as number,
        hexGridSize: dbSession.config_hex_grid_size as number,
        timePerQuestion: dbSession.config_time_per_question as number,
        pointsPerCorrectAnswer: dbSession.config_points_per_correct_answer as number,
        allowSkip: dbSession.config_allow_skip as boolean,
      },
      design: {
        team1: {
          name: dbSession.design_team1_name as string,
          color: dbSession.design_team1_color as string,
          icon: dbSession.design_team1_icon as string,
        },
        team2: {
          name: dbSession.design_team2_name as string,
          color: dbSession.design_team2_color as string,
          icon: dbSession.design_team2_icon as string,
        },
        backgroundTheme: dbSession.design_background_theme as string,
        customBackgroundUrl: dbSession.design_custom_background_url as string | undefined,
        logoUrl: dbSession.design_logo_url as string | undefined,
        brandingText: dbSession.design_branding_text as string | undefined,
      },
      questions: parsedQuestions as Session['questions'],
      postGameFileUrl: dbSession.post_game_file_url as string | undefined,
      backgroundMusicUrl: dbSession.background_music_url as string | undefined,
      autoRestart: dbSession.auto_restart as boolean | undefined,
      restartDelay: dbSession.restart_delay as number | undefined,
      createdAt: dbSession.created_at as string,
      updatedAt: dbSession.updated_at as string,
    };
  },
};
