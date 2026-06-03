import { create } from 'zustand';

type ActiveRole = 'admin' | 'creator';
type CreatorInvitationStatus = 'pending' | 'accepted' | 'declined';

type StoredSession = {
  activeRole: ActiveRole;
  email: string;
  creatorInvitationStatus?: CreatorInvitationStatus;
};

const authStorageKey = 'rollerkluster-session';

interface UiState {
  sidebarCollapsed: boolean;
  creatorView: 'list' | 'grid';
  activeRole: ActiveRole;
  authHydrated: boolean;
  isAuthenticated: boolean;
  sessionEmail: string;
  creatorInvitationStatus: CreatorInvitationStatus;
  toggleSidebar: () => void;
  setCreatorView: (view: 'list' | 'grid') => void;
  setActiveRole: (role: ActiveRole) => void;
  hydrateAuth: () => void;
  signIn: (role: ActiveRole, email: string) => void;
  signOut: () => void;
  setCreatorInvitationStatus: (status: CreatorInvitationStatus) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  creatorView: 'list',
  activeRole: 'admin',
  authHydrated: false,
  isAuthenticated: false,
  sessionEmail: '',
  creatorInvitationStatus: 'pending',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCreatorView: (creatorView) => set({ creatorView }),
  setActiveRole: (activeRole) => set({ activeRole }),
  hydrateAuth: () => {
    if (typeof window === 'undefined') {
      set({ authHydrated: true });
      return;
    }

    const stored = window.localStorage.getItem(authStorageKey);
    if (!stored) {
      set({ authHydrated: true, isAuthenticated: false });
      return;
    }

    try {
      const session = JSON.parse(stored) as Partial<StoredSession>;
      const activeRole = session.activeRole === 'creator' ? 'creator' : 'admin';
      set({
        activeRole,
        authHydrated: true,
        isAuthenticated: Boolean(session.email),
        sessionEmail: session.email ?? '',
        creatorInvitationStatus: session.creatorInvitationStatus ?? 'pending',
      });
    } catch {
      window.localStorage.removeItem(authStorageKey);
      set({ authHydrated: true, isAuthenticated: false, sessionEmail: '' });
    }
  },
  signIn: (activeRole, email) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(authStorageKey, JSON.stringify({ activeRole, email, creatorInvitationStatus: 'pending' }));
    }
    set({ activeRole, authHydrated: true, isAuthenticated: true, sessionEmail: email, creatorInvitationStatus: 'pending' });
  },
  signOut: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(authStorageKey);
    }
    set({ activeRole: 'admin', isAuthenticated: false, sessionEmail: '', creatorInvitationStatus: 'pending' });
  },
  setCreatorInvitationStatus: (creatorInvitationStatus) => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(authStorageKey);
      const session = stored ? JSON.parse(stored) as Partial<StoredSession> : {};
      window.localStorage.setItem(authStorageKey, JSON.stringify({ ...session, creatorInvitationStatus }));
    }
    set({ creatorInvitationStatus });
  },
}));
