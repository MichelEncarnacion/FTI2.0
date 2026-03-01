// src/componentes/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FiMenu, FiX, FiChevronDown, FiLogOut, FiArrowRight, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import logo from '../assets/logo-copia.png';

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const logged = !!user;

  const PUBLIC_REGEX = /^\/($|saps(\/|$)|proyecto(\/|$)|login(\/|$)|contact(\/|$)|about(\/|$))/i;
  const isPublicRoute = PUBLIC_REGEX.test(location.pathname);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSapsDesk, setOpenSapsDesk] = useState(false);

  // Bloquear scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileOpen]);

  const sapsItems = [
    { label: "Trabajo y Competitividad", to: "/saps/trabajo-competitividad" },
    { label: "Vida y Salud", to: "/saps/vida-salud" },
    { label: "STEM", to: "/saps/stem" },
    { label: "Desarrollo Humano", to: "/saps/desarrollo-humano" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      setMobileOpen(false);
      nav("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-[100] bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">

          {/* Logo */}
          <Link to="/" className="hover:opacity-80 transition-opacity z-[110]">
            <img src={logo} alt="UPAEP" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {!logged && (
              <div
                className="relative group py-7"
                onMouseEnter={() => setOpenSapsDesk(true)}
                onMouseLeave={() => setOpenSapsDesk(false)}
              >
                <button className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2 ${openSapsDesk ? 'text-red-600' : 'text-gray-400 hover:text-white'}`}>
                  Explorar SAPS <FiChevronDown className={`transition-transform duration-300 ${openSapsDesk ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute bottom-0 left-0 h-0.5 bg-red-600 transition-all duration-300 ${openSapsDesk ? 'w-full' : 'w-0'}`} />

                {openSapsDesk && (
                  <div className="absolute top-[80px] right-0 w-[350px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                    {sapsItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="group/item flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all"
                        onClick={() => setOpenSapsDesk(false)}
                      >
                        <span className="text-sm font-medium text-gray-300 group-hover/item:text-white">{item.label}</span>
                        <FiArrowRight className="text-red-600 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="h-4 w-px bg-white/10" />

            {logged ? (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-none">{profile?.nombre || user.email}</p>
                  <p className="text-[10px] text-red-600 font-black uppercase mt-1 tracking-widest">{profile?.rol}</p>
                </div>
                <button onClick={handleLogout} className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-red-500 transition-all">
                  <FiLogOut size={18} />
                </button>
              </div>
            ) : (
              isPublicRoute && location.pathname !== "/login" && (
                <Link
                  to="/login"
                  className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 bg-white text-black rounded-full hover:bg-red-600 hover:text-white transition-all"
                >
                  Acceso Staff
                </Link>
              )
            )}
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden z-[160] p-2 text-white bg-white/5 rounded-lg border border-white/10"
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>

      {/* Menú Móvil - Full Screen OverLay */}
      <div className={`
        lg:hidden fixed inset-0 z-[150] bg-black transition-all duration-500 ease-in-out
        ${mobileOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
      `}>
        <div className="flex flex-col h-full pt-28 px-8 pb-10 overflow-y-auto">
          {!logged && (
            <div className="space-y-8">
              <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.3em]">Líneas de SAPS</p>
              <nav className="flex flex-col gap-8">
                {sapsItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-3xl font-bold text-white active:text-red-600 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <div className="mt-auto pt-10 border-t border-white/10">
            {logged ? (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-xl font-bold">
                    {profile?.nombre?.charAt(0) || <FiUser />}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{profile?.nombre || 'Usuario'}</p>
                    <p className="text-red-600 text-xs font-black uppercase tracking-widest">{profile?.rol}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3"
                >
                  <FiLogOut /> Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full bg-white text-black text-center py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}