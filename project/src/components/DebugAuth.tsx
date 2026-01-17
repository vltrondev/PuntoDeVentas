import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';

export default function DebugAuth() {
    const { user, role, isAdmin, loading } = useAuth();
    const [directProfile, setDirectProfile] = useState<any>(null);
    const [directError, setDirectError] = useState<any>(null);
    const [isMinimized, setIsMinimized] = useState(true); // Default to minimized

    useEffect(() => {
        async function checkProfile() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                setDirectProfile(data);
                setDirectError(error);
            } catch (err) {
                setDirectError(err);
            }
        }
        checkProfile();
    }, [user]);

    if (!import.meta.env.DEV) return null;

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 bg-black/90 text-white p-2 rounded-full shadow-lg z-50 hover:bg-black transition-colors flex items-center gap-2 text-xs border border-gray-700"
                title="Expandir Debugger"
            >
                <Activity className="h-4 w-4 text-green-400" />
                <span className="font-mono">Debug</span>
                <ChevronUp className="h-3 w-3" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 p-4 bg-black/95 text-white rounded-lg text-xs font-mono z-50 max-w-md overflow-auto border border-gray-700 shadow-2xl max-h-[80vh]">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-green-400 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Auth Debugger
                </h3>
                <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1 hover:bg-gray-800 rounded"
                >
                    <ChevronDown className="h-4 w-4" />
                </button>
            </div>

            <div className="mb-2 border-b border-gray-700 pb-2">
                <div className="text-gray-400">Hooks State:</div>
                <div>Loading: {loading ? 'true' : 'false'}</div>
                <div>User ID: {user?.id}</div>
                <div>Role (state): {JSON.stringify(role)}</div>
                <div style={{ color: isAdmin ? '#4ade80' : '#f87171' }}>
                    isAdmin: {isAdmin ? 'TRUE' : 'FALSE'}
                </div>
            </div>

            <div className="mb-2">
                <div className="text-gray-400 font-bold">Direct DB Query Result:</div>
                {directError ? (
                    <div className="text-red-400 bg-red-900/20 p-2 rounded">
                        ERROR: {JSON.stringify(directError, null, 2)}
                    </div>
                ) : (
                    <div className="text-blue-300 bg-blue-900/20 p-2 rounded whitespace-pre-wrap">
                        {directProfile ? JSON.stringify(directProfile, null, 2) : 'No profile data found'}
                    </div>
                )}
            </div>

            <div className="text-[10px] text-gray-500 mt-2">
                Si ves "PGRST116", no hay filas.
                Si ves "401/403", es permisos (RLS).
            </div>
        </div>
    );
}
