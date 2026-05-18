
import { Work } from './workService';
import { Category } from './categoryService';

import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const AUTH_KEY = 'magliamente_auth';

export const storageService = {
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async login() {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem(AUTH_KEY, 'true');
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  },

  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("Logout failed", error);
    }
  },

  isLoggedIn(): boolean {
    return localStorage.getItem(AUTH_KEY) === 'true' || auth.currentUser !== null;
  },

  isAdmin(): boolean {
    return auth.currentUser?.email === 'sgobbi.marco@gmail.com';
  }
};


