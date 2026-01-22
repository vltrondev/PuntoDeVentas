import React, { createContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: string | null;
    isAdmin: boolean;
    isCourier: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<any>;
    signUp: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<any>;
    resetPassword: (email: string) => Promise<any>;
    updatePassword: (password: string) => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Use refs to track state without triggering re-runs of the effect
    const roleRef = useRef(role);
    const sessionRef = useRef(session);

    useEffect(() => {
        roleRef.current = role;
        sessionRef.current = session;
    }, [role, session]);

    useEffect(() => {
        const setData = async () => {
            try {
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                if (error) throw error;

                // Check against REF to avoid stale closure issues
                if (currentSession?.access_token !== sessionRef.current?.access_token) {
                    setSession(currentSession);
                    setUser(currentSession?.user ?? null);
                }

                if (currentSession?.user) {
                    // Only fetch profile if we don't have the role or if we want to ensure it's fresh
                    // We can optimize further by caching, but one request per session load is fine.
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', currentSession.user.id)
                        .single();

                    if (profileError && profileError.code !== 'PGRST116') {
                        console.error('Error fetching profile:', profileError);
                    }

                    // Check against REF
                    if (profile?.role !== roleRef.current) {
                        setRole(profile?.role || null);
                    }
                } else {
                    if (roleRef.current !== null) setRole(null);
                }
            } catch (error) {
                console.error('Error in auth setup:', error);
            } finally {
                setLoading(false);
            }
        };

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.access_token !== sessionRef.current?.access_token) {
                setData();
            } else if (!session && sessionRef.current) {
                // Handle logout specifically if needed, or let setData handle it
                setData();
            }
        });

        setData();

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    const signIn = (email: string, password: string) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = (email: string, password: string) => {
        return supabase.auth.signUp({ email, password });
    };

    const signOut = () => {
        return supabase.auth.signOut();
    };

    const resetPassword = (email: string) => {
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/actualizar-password`,
        });
    };

    const updatePassword = (password: string) => {
        return supabase.auth.updateUser({ password });
    };

    const value = {
        user,
        session,
        role,
        isAdmin: role?.toLowerCase() === 'admin',
        isCourier: role?.toLowerCase() === 'courier',
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
