// lib/authContext.js
import { createContext, useContext, useEffect, useRef, useState } from 'react';

const AuthContext = createContext();
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

function parseJwtExp(token) {
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('access_token') || ''; } catch { return ''; }
  });
  const [refreshToken, setRefreshToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('refresh_token') || ''; } catch { return ''; }
  });
  const [loading, setLoading] = useState(true);

  const refreshTimer = useRef(null);
  const isRefreshing = useRef(false);

  const saveTokens = (access, refresh) => {
    setAccessToken(access || '');
    setRefreshToken(refresh || '');
    if (typeof window === 'undefined') return;
    try {
      if (access) localStorage.setItem('access_token', access); else localStorage.removeItem('access_token');
      if (refresh) localStorage.setItem('refresh_token', refresh); else localStorage.removeItem('refresh_token');
    } catch {}
  };

  const logout = () => {
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_id');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    
    window.location.href = '/login';
  };

  const refreshAccessToken = async () => {
    if (isRefreshing.current || !refreshToken) return false;
    
    isRefreshing.current = true;
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        console.error('Token refresh failed');
        logout();
        return false;
      }

      const data = await response.json();
      saveTokens(data.access_token, data.refresh_token || refreshToken);
      
      console.log('Token refreshed successfully at:', new Date().toLocaleTimeString());
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return false;
    } finally {
      isRefreshing.current = false;
    }
  };

  const scheduleProactiveRefresh = (token) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    
    const expMs = parseJwtExp(token);
    if (!expMs) return;
    
    const msUntilRefresh = Math.max(0, expMs - Date.now() - 60_000);
    
    console.log(`Next token refresh scheduled in ${Math.round(msUntilRefresh / 1000)} seconds`);
    
    refreshTimer.current = setTimeout(async () => {
      console.log('Proactive token refresh triggered');
      const success = await refreshAccessToken();
      
      if (success && accessToken) {
        scheduleProactiveRefresh(accessToken);
      }
    }, msUntilRefresh);
  };

  const apiFetch = async (path, init = {}) => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const headers = new Headers(init.headers || {});
    
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    const response = await fetch(url, {
      ...init,
      headers,
    });

    if (response.status === 401 && !isRefreshing.current) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        headers.set('Authorization', `Bearer ${accessToken}`);
        return fetch(url, {
          ...init,
          headers,
        });
      }
    }
    
    return response;
  };

  const fetchUserInfo = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401) {
        logout();
      }
    } catch (e) {
      console.error('Failed to fetch user info:', e);
    }
  };

  useEffect(() => {
    if (accessToken) {
      scheduleProactiveRefresh(accessToken);
    }
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [accessToken]);

  useEffect(() => {
    (async () => {
      if (accessToken) await fetchUserInfo();
      setLoading(false);
    })();
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      saveTokens, 
      logout,
      refreshAccessToken,
      accessToken, 
      refreshToken, 
      setUser,
      apiFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);