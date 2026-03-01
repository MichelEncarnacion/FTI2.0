import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute({ children }) {
    const { user, profile, loading } = useAuth();

    if (loading) return null; // O un spinner

    if (user) {
        // Si ya hay usuario, redirigir a su panel
        return profile?.rol === 'administrador'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/prof" replace />;
    }

    return children;
}