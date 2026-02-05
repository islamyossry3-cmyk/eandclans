import { create } from 'zustand';
import { authService, type AuthUser } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, organizationName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signUp: async (email: string, password: string, organizationName: string) => {
    set({ isLoading: true, error: null });
    const response = await authService.signUp(email, password, organizationName);
    if (response.success) {
      set({ user: response.user || null, isLoading: false });
    } else {
      set({ error: response.error || 'Signup failed', isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const response = await authService.signIn(email, password);
    if (response.success) {
      set({ user: response.user || null, isLoading: false });
    } else {
      set({ error: response.error || 'Login failed', isLoading: false });
      throw new Error(response.error || 'Login failed');
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    const response = await authService.signOut();
    if (response.success) {
      set({ user: null, isLoading: false });
    } else {
      set({ error: response.error || 'Logout failed', isLoading: false });
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    const user = await authService.getCurrentUser();
    set({ user, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
