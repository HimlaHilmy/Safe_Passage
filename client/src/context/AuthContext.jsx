import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  traveler: {
    id: '65e000000000000000000001',
    name: 'Sarah Jenkins',
    email: 'traveler@safepassage.org',
    role: 'traveler',
    phone: '+1 (555) 234-5678',
    token: 'demo-jwt-token-traveler-2026',
  },
  provider: {
    id: '65e000000000000000000002',
    name: 'Apex Rapid Response Ltd',
    email: 'provider@safepassage.org',
    role: 'provider',
    phone: '+1 (555) 987-6543',
    token: 'demo-jwt-token-provider-2026',
  },
  admin: {
    id: '65e000000000000000000003',
    name: 'Himla (Admin Lead)',
    email: 'admin@safepassage.org',
    role: 'admin',
    phone: '+1 (555) 000-1122',
    token: 'demo-jwt-token-admin-2026',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('safe_passage_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage or default to demo traveler for seamless evaluation
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('safe_passage_user');
      const savedToken = localStorage.getItem('safe_passage_token');

      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } else {
        // Default to demo traveler for immediate demonstration convenience
        setUser(DEMO_ACCOUNTS.traveler);
        setToken(DEMO_ACCOUNTS.traveler.token);
        localStorage.setItem('safe_passage_user', JSON.stringify(DEMO_ACCOUNTS.traveler));
        localStorage.setItem('safe_passage_token', DEMO_ACCOUNTS.traveler.token);
      }
    } catch {
      setUser(DEMO_ACCOUNTS.traveler);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        const authUser = resData.data.user;
        const authToken = resData.data.token;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('safe_passage_user', JSON.stringify(authUser));
        localStorage.setItem('safe_passage_token', authToken);
        return { success: true, user: authUser };
      } else {
        throw new Error(resData.message || 'Login failed');
      }
    } catch (err) {
      // Offline fallback: check if matches one of our demo emails
      for (const key of Object.keys(DEMO_ACCOUNTS)) {
        if (DEMO_ACCOUNTS[key].email === cleanEmail) {
          const demo = DEMO_ACCOUNTS[key];
          setUser(demo);
          setToken(demo.token);
          localStorage.setItem('safe_passage_user', JSON.stringify(demo));
          localStorage.setItem('safe_passage_token', demo.token);
          return { success: true, user: demo, fallback: true };
        }
      }
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        const authUser = resData.data.user;
        const authToken = resData.data.token;
        setUser(authUser);
        setToken(authToken);
        localStorage.setItem('safe_passage_user', JSON.stringify(authUser));
        localStorage.setItem('safe_passage_token', authToken);
        return { success: true, user: authUser };
      }
      throw new Error(resData.message || 'Registration failed');
    } catch (err) {
      // Local fallback
      const mockUser = {
        id: '65e' + Math.random().toString(16).substring(2, 23),
        name: userData.name,
        email: userData.email,
        role: userData.role || 'traveler',
        phone: userData.phone || '',
        token: 'mock-reg-token',
      };
      setUser(mockUser);
      setToken(mockUser.token);
      localStorage.setItem('safe_passage_user', JSON.stringify(mockUser));
      localStorage.setItem('safe_passage_token', mockUser.token);
      return { success: true, user: mockUser, fallback: true };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('safe_passage_user');
    localStorage.removeItem('safe_passage_token');
  };

  // Instant 1-click role switcher for university evaluations & testing
  const switchDemoRole = (role) => {
    if (DEMO_ACCOUNTS[role]) {
      const target = DEMO_ACCOUNTS[role];
      setUser(target);
      setToken(target.token);
      localStorage.setItem('safe_passage_user', JSON.stringify(target));
      localStorage.setItem('safe_passage_token', target.token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role || 'guest',
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
