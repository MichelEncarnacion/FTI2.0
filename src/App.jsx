// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Importamos el Provider de tu Contexto
import { AuthProvider } from './context/AuthContext';

// Estilos globales de carrusel
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Componentes
import Navbar from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import PublicRoute from './components/PublicRoute';

// Autenticación
import Login from './auth/Login';

// Páginas Públicas
import Home from './pages/Home';
import ProyectoDetail from "./pages/ProyectoDetail";
import SapsTrabajoCompetitividad from './pages/SapsTrabajoCompetitividad';
import SapsVidaSalud from './pages/SapsVidaSalud';
import SapsStem from './pages/SapsStem';
import SapsDesarrolloHumano from './pages/SapsDesarrolloHumano';

// Páginas de Profesor
import DashProf from './pages/prof/Dashboard';
import NuevoProyecto from "./pages/prof/NuevoProyecto";
import EditarProyecto from "./pages/prof/EditarProyecto";

// Páginas de Administrador
// Cambiamos la importación para que apunte exactamente a tu archivo Dashboard.jsx
import DashAdmin from "./pages/admin/Dashboard";

function AppWrapper() {
  const location = useLocation();

  // Oculta el Navbar principal en las rutas de admin o profesor
  const hideNavbar = location.pathname.startsWith('/admin') || location.pathname.startsWith('/prof');

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* =======================
            RUTAS PÚBLICAS
        ======================= */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        <Route path="/saps/trabajo-competitividad" element={<SapsTrabajoCompetitividad />} />
        <Route path="/saps/vida-salud" element={<SapsVidaSalud />} />
        <Route path="/saps/stem" element={<SapsStem />} />
        <Route path="/saps/desarrollo-humano" element={<SapsDesarrolloHumano />} />
        <Route path="/proyecto/:id" element={<ProyectoDetail />} />

        {/* =======================
            RUTAS PROFESOR
        ======================= */}
        <Route path="/prof" element={
          <RequireAuth role="profesor">
            <DashProf />
          </RequireAuth>
        } />

        <Route path="/prof/proyectos/nuevo" element={
          <RequireAuth role="profesor">
            <NuevoProyecto />
          </RequireAuth>
        } />

        <Route path="/prof/proyectos/:id/editar" element={
          <RequireAuth role="profesor">
            <EditarProyecto />
          </RequireAuth>
        } />

        {/* =======================
            RUTAS ADMIN (Todo en uno)
        ======================= */}
        <Route path="/admin" element={
          <RequireAuth role="administrador">
            <DashAdmin />
          </RequireAuth>
        } />

        {/* Si antes tenías /admin/usuarios o /admin/profesores, 
            las redirigimos a /admin para evitar errores 404 */}
        <Route path="/admin/usuarios" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/profesores" element={<Navigate to="/admin" replace />} />

        {/* =======================
            REDIRECCIÓN POR DEFECTO
        ======================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
}