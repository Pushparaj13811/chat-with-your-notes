import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { authApi, googleAuth, tokenManager } from '../services/auth';
import { getOrCreateDeviceId } from '../utils/deviceManager';
import type { AuthState, AuthContextType, LoginCredentials, SignupCredentials, User } from '../types/auth';

// Auth reducer
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'CLEAR_AUTH' }
  | { type: 'SET_AUTH'; payload: { user: User; token: string } };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload,
        isAuthenticated: !!action.payload 
      };
    
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      };
    
    case 'CLEAR_AUTH':
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false
      };
    
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenManager.getToken();
        
        if (token) {
          dispatch({ type: 'SET_TOKEN', payload: token });
          
          // Verify token and get user profile
          try {
            const response = await authApi.getProfile();
            dispatch({ type: 'SET_USER', payload: response.data.user });
          } catch {
            // Token invalid, clear it
            tokenManager.clearToken();
            dispatch({ type: 'CLEAR_AUTH' });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Setup token interceptors
    tokenManager.setupInterceptors();
    
    initAuth();
  }, []);

  // Watch for token changes and update auth state
  useEffect(() => {
    if (state.token && !state.user && !state.isLoading) {
      const fetchUser = async () => {
        try {
          const response = await authApi.getProfile();
          dispatch({ type: 'SET_USER', payload: response.data.user });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      };
      fetchUser();
    }
  }, [state.token, state.user, state.isLoading]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await authApi.login(credentials);
      const { user, token } = response.data;
      
      tokenManager.setToken(token);
      dispatch({ type: 'SET_AUTH', payload: { user, token } });
      
      // Automatically migrate device data
      try {
        const deviceId = getOrCreateDeviceId();
        await authApi.migrateDeviceData(deviceId);
        console.log('✅ Device data migrated successfully');
      } catch (migrationError) {
        console.warn('Device data migration failed:', migrationError);
        // Don't fail login if migration fails
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await authApi.signup(credentials);
      const { user, token } = response.data;
      
      tokenManager.setToken(token);
      dispatch({ type: 'SET_AUTH', payload: { user, token } });
      
      // Automatically migrate device data
      try {
        const deviceId = getOrCreateDeviceId();
        await authApi.migrateDeviceData(deviceId);
        console.log('✅ Device data migrated successfully');
      } catch (migrationError) {
        console.warn('Device data migration failed:', migrationError);
        // Don't fail signup if migration fails
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      tokenManager.clearToken();
      dispatch({ type: 'CLEAR_AUTH' });
    }
  };

  const loginWithGoogle = (): void => {
    const deviceId = getOrCreateDeviceId();
    const googleAuthUrl = googleAuth.getGoogleAuthUrl(deviceId);
    window.location.href = googleAuthUrl;
  };

  const migrateDeviceData = async (): Promise<void> => {
    if (!state.user) {
      throw new Error('User must be authenticated to migrate data');
    }
    
    const deviceId = getOrCreateDeviceId();
    await authApi.migrateDeviceData(deviceId);
  };

  const setToken = (token: string): void => {
    tokenManager.setToken(token);
    dispatch({ type: 'SET_TOKEN', payload: token });
  };

  const setAuthFromOAuth = async (token: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Set token first
      tokenManager.setToken(token);
      dispatch({ type: 'SET_TOKEN', payload: token });
      
      // Get user profile
      const response = await authApi.getProfile();
      const user = response.data.user;
      
      // Set complete authentication state
      dispatch({ type: 'SET_AUTH', payload: { user, token } });
      
      // Automatically migrate device data
      try {
        const deviceId = getOrCreateDeviceId();
        await authApi.migrateDeviceData(deviceId);
        console.log('✅ Device data migrated successfully');
      } catch (migrationError) {
        console.warn('Device data migration failed:', migrationError);
        // Don't fail login if migration fails
      }
    } catch (error) {
      // Clear token if profile fetch fails
      tokenManager.clearToken();
      dispatch({ type: 'CLEAR_AUTH' });
      throw error;
    }
  };

  const clearAuth = (): void => {
    tokenManager.clearToken();
    dispatch({ type: 'CLEAR_AUTH' });
  };

  const value: AuthContextType = {
    // State
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    login,
    signup,
    logout,
    loginWithGoogle,
    migrateDeviceData,
    setToken,
    setAuthFromOAuth,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};