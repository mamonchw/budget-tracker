import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On initial load, try to fetch user details to see if we're still logged in
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          // If no token, maybe we have a refresh token cookie. Let's try to hit /auth/refresh
          // Wait, the easiest way is to hit the /auth/me route. The interceptor will handle the refresh if needed.
          const res = await api.get('/auth/me');
          // If successful, we don't have the full user object from /me, just the ID.
          // But actually, we should store user info in local storage for simplicity, 
          // or just fetch it. Let's assume /me returns the ID, but we might want full user data.
          // For now, if we get here, they are authenticated. 
          setUser({ id: res.data.data.userId, name: 'User', email: '' }); 
        } else {
           const res = await api.get('/auth/me');
           setUser({ id: res.data.data.userId, name: 'User', email: '' });
        }
      } catch (error) {
        // Ignore error, they are just not logged in
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
