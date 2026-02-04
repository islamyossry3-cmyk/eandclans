import { supabase } from '../lib/supabase';

export interface AdminProfile {
  id: string;
  auth_id: string;
  email: string;
  organization_name: string | null;
  is_super_admin: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  license_expires_at: string | null;
  last_login_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  totalAdmins: number;
  pendingAdmins: number;
  approvedAdmins: number;
  rejectedAdmins: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalPlayers: number;
  expiringLicenses: number;
}

export const superAdminService = {
  async getAllAdmins(): Promise<AdminProfile[]> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateAdmin(
    adminId: string,
    updates: {
      approval_status?: 'pending' | 'approved' | 'rejected';
      license_expires_at?: string | null;
      notes?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('admins')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (error) throw error;
  },

  async approveAdmin(adminId: string, licenseExpiresAt?: string): Promise<void> {
    await this.updateAdmin(adminId, {
      approval_status: 'approved',
      license_expires_at: licenseExpiresAt || null,
    });
  },

  async rejectAdmin(adminId: string, reason?: string): Promise<void> {
    await this.updateAdmin(adminId, {
      approval_status: 'rejected',
      notes: reason,
    });
  },

  async deleteAdmin(adminId: string): Promise<void> {
    const { data: admin, error: fetchError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('id', adminId)
      .single();

    if (fetchError) throw fetchError;

    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (deleteError) throw deleteError;
  },

  async setLicenseExpiry(adminId: string, expiresAt: string | null): Promise<void> {
    await this.updateAdmin(adminId, {
      license_expires_at: expiresAt,
    });
  },

  async getUsageStats(): Promise<UsageStats> {
    const [adminsResult, sessionsResult, sessionHistoryResult] = await Promise.all([
      supabase.from('admins').select('approval_status, license_expires_at'),
      supabase.from('sessions').select('status'),
      supabase.from('session_history').select('total_players'),
    ]);

    const admins = adminsResult.data || [];
    const sessions = sessionsResult.data || [];
    const sessionHistory = sessionHistoryResult.data || [];

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringLicenses = admins.filter((admin) => {
      if (!admin.license_expires_at) return false;
      const expiryDate = new Date(admin.license_expires_at);
      return expiryDate > now && expiryDate <= thirtyDaysFromNow;
    }).length;

    const totalPlayers = sessionHistory.reduce(
      (sum, history) => sum + (history.total_players || 0),
      0
    );

    return {
      totalAdmins: admins.length,
      pendingAdmins: admins.filter((a) => a.approval_status === 'pending').length,
      approvedAdmins: admins.filter((a) => a.approval_status === 'approved').length,
      rejectedAdmins: admins.filter((a) => a.approval_status === 'rejected').length,
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.status === 'live').length,
      completedSessions: sessions.filter((s) => s.status === 'completed').length,
      totalPlayers,
      expiringLicenses,
    };
  },

  async getAdminSessions(adminId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
