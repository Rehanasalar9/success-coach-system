import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tempToken: string | null;
  tempStudentId: string | null;
  isLoading: boolean;
  login: (loginIdentifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  quickSwitchRole: (role: 'admin' | 'smith' | 'davis') => Promise<void>;
  setTempAccess: (token: string, studentId: string) => void;
  clearTempAccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [tempToken, setTempToken] = useState<string | null>(localStorage.getItem('temp_otp_token'));
  const [tempStudentId, setTempStudentId] = useState<string | null>(localStorage.getItem('temp_otp_student_id'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Failed to load user session:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (loginIdentifier: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await authApi.login(loginIdentifier, password);
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoading(false);
        return true;
      }
    } catch (err: any) {
      console.error('Login error:', err);
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('temp_otp_token');
    localStorage.removeItem('temp_otp_student_id');
    setToken(null);
    setUser(null);
    setTempToken(null);
    setTempStudentId(null);
  };

  const setTempAccess = (newToken: string, studentId: string) => {
    localStorage.setItem('temp_otp_token', newToken);
    localStorage.setItem('temp_otp_student_id', studentId);
    setTempToken(newToken);
    setTempStudentId(studentId);
  };

  const clearTempAccess = () => {
    localStorage.removeItem('temp_otp_token');
    localStorage.removeItem('temp_otp_student_id');
    setTempToken(null);
    setTempStudentId(null);
  };

  const quickSwitchRole = async (role: 'admin' | 'smith' | 'davis') => {
    clearTempAccess();

    if (role === 'admin') {
      await login('testadmin@college.edu', 'admin123');
    } else if (role === 'smith') {
      await login('testcoach@college.edu', 'coach123');
    } else if (role === 'davis') {
      await login('testcoach@college.edu', 'coach123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tempToken,
        tempStudentId,
        isLoading,
        login,
        logout,
        quickSwitchRole,
        setTempAccess,
        clearTempAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
