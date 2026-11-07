import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to clear all authentication data
  const clearSession = useCallback(() => {
    localStorage.removeItem('safe_passage_user');
    localStorage.removeItem('safe_passage_token');
    sessionStorage.removeItem('safe_passage_user');
    sessionStorage.removeItem('safe_passage_token');
    setUser(null);
    setToken(null);
  }, []);

  // Initialize from storage and validate token with backend /api/auth/me
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken =
          localStorage.getItem('safe_passage_token') ||
          sessionStorage.getItem('safe_passage_token');

        // Discard any legacy demo or mock tokens
        if (
          !savedToken ||
          savedToken === 'demo-jwt-token-traveler-2026' ||
          savedToken === 'demo-jwt-token-provider-2026' ||
          savedToken === 'demo-jwt-token-admin-2026' ||
          savedToken.startsWith('mock-')
        ) {
          clearSession();
          setLoading(false);
          return;
        }

        // Validate the saved token with backend before treating as authenticated
        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (res.ok) {
            const resData = await res.json();
            if (resData.success && resData.data) {
              const verifiedUser = {
                id: resData.data._id || resData.data.id,
                name: resData.data.name,
                email: resData.data.email,
                role: resData.data.role,
                phone: resData.data.phone || '',
              };
              setUser(verifiedUser);
              setToken(savedToken);
              localStorage.setItem('safe_passage_user', JSON.stringify(verifiedUser));
            } else {
              clearSession();
            }
          } else {
            // Invalid, expired, or rejected token
            console.warn('[Auth] Stored token rejected by server with status:', res.status);
            clearSession();
          }
        } catch (netErr) {
          console.warn('[Auth] Could not reach auth backend for session check:', netErr.message);
          // If network is offline, keep previous session from storage if it exists
          const savedUser =
            localStorage.getItem('safe_passage_user') ||
            sessionStorage.getItem('safe_passage_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
          } else {
            clearSession();
          }
        }
      } catch (err) {
        console.error('[Auth Init Error]', err);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [clearSession]);

  const login = async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
        return {
          success: false,
          message: resData.message || 'Invalid email or password.',
        };
      }
    } catch (err) {
      console.error('[Login Network Error]', err);
      return {
        success: false,
        message: 'Unable to connect to the authentication service. Please check your connection.',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
      } else {
        return {
          success: false,
          message: resData.message || 'Registration failed.',
        };
      }
    } catch (err) {
      console.error('[Register Network Error]', err);
      return {
        success: false,
        message: 'Unable to connect to the registration service. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        role: user?.role || 'guest',
        login,
        register,
        logout,
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
