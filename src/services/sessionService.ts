import { supabase } from '../lib/supabase';
import type { Session, Question } from '../types/session';

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
        design_background_theme: data.design?.backgroundTheme || 'innovation',
        design_logo_url: data.design?.logoUrl,
        design_branding_text: data.design?.brandingText,
        questions: JSON.stringify(data.questions || []),
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
      const updateData: any = {
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
        updateData.design_logo_url = data.design.logoUrl;
        updateData.design_branding_text = data.design.brandingText;
      }

      if (data.questions) {
        updateData.questions = JSON.stringify(data.questions);
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

  mapDbToSession(dbSession: any): Session {
    return {
      id: dbSession.id,
      adminId: dbSession.admin_id,
      name: dbSession.name,
      description: dbSession.description,
      type: dbSession.type,
      status: dbSession.status,
      sessionPin: dbSession.session_pin,
      qrCodeData: dbSession.qr_code_data,
      config: {
        duration: dbSession.config_duration,
        maxPlayersPerTeam: dbSession.config_max_players_per_team,
        hexGridSize: dbSession.config_hex_grid_size,
        timePerQuestion: dbSession.config_time_per_question,
        pointsPerCorrectAnswer: dbSession.config_points_per_correct_answer,
        allowSkip: dbSession.config_allow_skip,
      },
      design: {
        team1: {
          name: dbSession.design_team1_name,
          color: dbSession.design_team1_color,
          icon: dbSession.design_team1_icon,
        },
        team2: {
          name: dbSession.design_team2_name,
          color: dbSession.design_team2_color,
          icon: dbSession.design_team2_icon,
        },
        backgroundTheme: dbSession.design_background_theme,
        logoUrl: dbSession.design_logo_url,
        brandingText: dbSession.design_branding_text,
      },
      questions: typeof dbSession.questions === 'string'
        ? JSON.parse(dbSession.questions)
        : dbSession.questions,
      createdAt: dbSession.created_at,
      updatedAt: dbSession.updated_at,
    };
  },
};
