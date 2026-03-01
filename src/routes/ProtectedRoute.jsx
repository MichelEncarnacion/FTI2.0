import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, profile, loading } = useAuth();

    // 1. Mientras Supabase verifica la sesión, mostramos un estado de carga
    if (loading) {
        return (
            <div className="min-h-screen w-screen bg-[#0b0d12] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // 2. Si no hay usuario logueado, lo mandamos al Login (ruta "/")
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 3. Si definimos roles permitidos para esta ruta, verificamos que el perfil cumpla
    if (allowedRoles && profile) {
        if (!allowedRoles.includes(profile.rol)) {
            // Si un profesor intenta entrar a /admin, lo regresamos a su panel
            // Si un admin intenta entrar a /prof, lo regresamos al suyo
            const redirectPath = profile.rol === 'administrador' ? '/admin' : '/prof';
            return <Navigate to={redirectPath} replace />;
        }
    }

    // 4. Si todo está bien (está logueado y tiene el rol correcto), mostramos la página
    return children;
}