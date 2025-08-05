export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  authProvider: 'custom' | 'google';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
  migrateDeviceData: () => Promise<void>;
  
  // Token management  
  setToken: (token: string) => void;
  setAuthFromOAuth: (token: string) => Promise<void>;
  clearAuth: () => void;
}