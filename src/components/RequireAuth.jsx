// src/components/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si tu context se llama distinto

export default function RequireAuth({ children, role }) {
    const { user, profile } = useAuth();
    const location = useLocation();

    // 1. Si no hay usuario logueado, lo mandamos al login
    // Guardamos la ruta de origen en 'state' para redirigirlo de vuelta después de loguearse
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Si se requiere un rol específico y el usuario no lo tiene
    // IMPORTANTE: Ajusta "profile?.rol" al nombre real de tu columna en la base de datos (ej. rol_id)
    if (role && profile?.rol !== role) {
        // Podrías redirigirlo a una página de "No autorizado" o al Home
        return <Navigate to="/" replace />;
    }

    // 3. Si todo está correcto, renderizamos el contenido protegido
    return children;
}