import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Función maestra: se encarga de actualizar el estado sin importar de dónde venga el aviso
        const handleSessionUpdate = async (session) => {
            if (!session?.user) {
                setUser(null);
                setProfile(null);
                setLoading(false); // Si no hay nadie, apagamos el loading
                return;
            }

            // Si hay usuario, lo guardamos
            setUser(session.user);

            // Buscamos su perfil
            try {
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error("Error al obtener el perfil:", error.message);
                } else {
                    setProfile(data);
                }
            } catch (err) {
                console.error("Error de conexión:", err);
            } finally {
                // Ya sea que encuentre el perfil o falle, apagamos el loading
                setLoading(false);
            }
        };

        // 1. Obtenemos la sesión inicial al cargar la página
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) console.error("Error en getSession:", error);
            handleSessionUpdate(session);
        });

        // 2. Escuchamos cualquier cambio futuro (login, logout, refresh token)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Evento Supabase detectado:", event);
            handleSessionUpdate(session);
        });

        // Limpieza al desmontar
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = async () => {
        // Limpiamos el estado local inmediatamente para que se sienta más rápido
        setUser(null);
        setProfile(null);
        await supabase.auth.signOut();
    };

    const value = { user, profile, loading, signIn, signOut };

    if (loading) {
        return (
            <div className="flex min-h-screen w-screen items-center justify-center bg-[#0b0d12]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
                    <p className="text-sm font-medium text-gray-400">Iniciando sistema...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};