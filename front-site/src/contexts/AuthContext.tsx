import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { BACKEND_URL } from '../config/constants';

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Base de API: usa VITE_BACKEND_URL, fallback a BACKEND_URL.
    // En dev (Vite proxy) podemos dejar vacío para usar rutas relativas.
    const rawBase = (import.meta.env.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_BASE || BACKEND_URL) as string;
    const isDev = import.meta.env.DEV;
    const apiBase = isDev ? '' : rawBase.replace(/\/$/, '');

    // On mount, reconcile client state with server session via /api/me
    useEffect(() => {
        const init = async () => {
            // Load optimistically from localStorage for immediate UX
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    localStorage.removeItem('user');
                }
            }

            // Always verify with backend to avoid stale auth state
            try {
                // Ensure CSRF cookie exists (stateful SPA pattern)
                await fetch(`${apiBase}/sanctum/csrf-cookie`, { credentials: 'include' });

                const res = await fetch(`${apiBase}/api/me`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data?.user) {
                        setUser(data.user);
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                } else {
                    // Session not valid server-side; clear client state
                    setUser(null);
                    localStorage.removeItem('user');
                }
            } catch {
                // Network/backend error: keep optimistic state, but don't block UI
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [apiBase]);

    const getCsrfToken = async (): Promise<void> => {
        await fetch(`${apiBase}/sanctum/csrf-cookie`, {
            credentials: 'include',
        });
    };

    const login = async (email: string, password: string, remember: boolean = false): Promise<User> => {
        try {
            // Get CSRF cookie first
            await getCsrfToken();

            // Get CSRF token from cookie
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };

            // Add CSRF token to headers if available
            if (token) {
                headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
            }

            const response = await fetch(`${apiBase}/api/login`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ email, password, remember }),
            });

            const text = await response.text();
            let data: any;

            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                throw new Error('Error del servidor. Por favor, verifica que el backend esté funcionando.');
            }

            if (!response.ok) {
                const errorMsg = data.errors?.email?.[0] || data.message || 'Credenciales incorrectas';
                throw new Error(errorMsg);
            }

            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await fetch(`${apiBase}/api/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });
        } catch (error) {
            // Silently fail
        } finally {
            setUser(null);
            localStorage.removeItem('user');
        }
    };

    const register = async (
        name: string,
        email: string,
        username: string,
        password: string,
        password_confirmation: string,
        birth_date: string,
        gender: string,
        captcha?: string
    ): Promise<User> => {
        try {
            // Get CSRF cookie first
            await getCsrfToken();

            // Get CSRF token from cookie
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };

            if (token) {
                headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
            }

            const response = await fetch(`${apiBase}/api/register`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    email,
                    username,
                    password,
                    password_confirmation,
                    birth_date,
                    gender,
                    captcha,
                }),
            });

            const text = await response.text();
            let data: any;

            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                throw new Error('Error del servidor. Por favor, intenta de nuevo.');
            }

            if (!response.ok) {
                // Handle validation errors
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
                }
                throw new Error(data.message || 'Error al registrar usuario');
            }

            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            throw error;
        }
    };

    const refreshUser = async (): Promise<void> => {
        try {
            const res = await fetch(`${apiBase}/api/me`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (res.ok) {
                const data = await res.json();
                if (data?.user) {
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            }
        } catch (error) {
            // Silently fail
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
        register,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin:
            Array.isArray(user?.roles)
                ? user!.roles.some((r: any) => {
                      const name = typeof r === 'string' ? r : r?.name;
                      return name === 'super_admin' || name === 'admin';
                  })
                : false,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
