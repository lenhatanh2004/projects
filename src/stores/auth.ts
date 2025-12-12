import { create } from 'zustand';

type AuthState = { signedIn: boolean; signIn: () => void; signOut: () => void };
export const useAuth = create<AuthState>((set) => ({
  signedIn: false,
  signIn: () => set({ signedIn: true }),
  signOut: () => set({ signedIn: false })
}));
