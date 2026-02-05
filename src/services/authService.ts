import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  adminId: string;
  email: string;
  organizationName?: string;
  isSuperAdmin: boolean;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

export const authService = {
  async signUp(
    email: string,
    password: string,
    organizationName: string
  ): Promise<AuthResponse> {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
        }
      );

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user returned from signup');

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .insert({
          auth_id: authData.user.id,
          email,
          organization_name: organizationName,
        })
        .select()
        .single();

      if (adminError) throw adminError;

      return {
        success: true,
        user: {
          id: authData.user.id,
          adminId: adminData.id,
          email,
          organizationName,
          isSuperAdmin: false,
        },
      };
    } catch (error) {
      let errorMessage = 'Signup failed';

      if (error instanceof Error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw signInError;
      if (!authData.user) throw new Error('No user returned from signin');

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!adminData) throw new Error('Admin profile not found');

      // Update last login time asynchronously (fire and forget)
      supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminData.id)
        .then(({ error }) => {
          if (error) console.error('Failed to update login time:', error);
        });

      return {
        success: true,
        user: {
          id: authData.user.id,
          adminId: adminData.id,
          email: adminData.email,
          organizationName: adminData.organization_name,
          isSuperAdmin: adminData.is_super_admin,
        },
      };
    } catch (error) {
      let errorMessage = 'Login failed';

      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid login credentials. Please check your email and password.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in.';
        } else if (error.message.includes('Admin profile not found')) {
          errorMessage = 'Admin account not found. Please contact support.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_id', data.user.id)
        .maybeSingle();

      if (adminError) return null;
      if (!adminData) return null;

      return {
        id: data.user.id,
        adminId: adminData.id,
        email: adminData.email,
        organizationName: adminData.organization_name,
        isSuperAdmin: adminData.is_super_admin,
      };
    } catch {
      return null;
    }
  },

  onAuthStateChange(
    callback: (user: AuthUser | null) => void
  ): (() => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        (async () => {
          const user = await this.getCurrentUser();
          callback(user);
        })();
      } else {
        callback(null);
      }
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  },
};
