import { useForm } from "react-hook-form";
import { useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiLoader } from "react-icons/fi";
import logo from '../assets/logo-copia.png';

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm();

  const navigate = useNavigate();
  const { signIn, user, profile } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const onKey = (e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  if (user && profile) {
    if (profile.rol === "administrador") return <Navigate to="/admin" replace />;
    if (profile.rol === "profesor") return <Navigate to="/prof" replace />;
  }

  async function onSubmit(data) {
    setApiError("");
    try {
      const { data: authData, error: authError } = await signIn(
        data.email.trim(),
        data.password
      );
      if (authError) throw authError;

      const { data: profileData, error: profileError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.rol === 'administrador') {
        navigate("/admin", { replace: true });
      } else {
        navigate("/prof", { replace: true });
      }
    } catch (err) {
      setApiError("Credenciales incorrectas o usuario no encontrado.");
      setError("email", { type: "server" });
      setError("password", { type: "server" });
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#05070a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Estilos Globales de Autofill y Animaciones */}
      <style>{`
        input:-webkit-autofill {
          -webkit-text-fill-color: #fff !important;
          -webkit-box-shadow: 0 0 0px 1000px #111827 inset !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-login { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>

      {/* Fondos de Luz Ambiental (Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] animate-login relative z-10">

        {/* Header con Logo */}
        <div className="mb-10 text-center">
          <div className="inline-block p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 mb-4">
            <img src={logo} alt="UPAEP" className="h-10 w-auto" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bienvenido</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium italic">Portal de Gestión SAPS</p>
        </div>

        {/* Card de Login */}
        <div className="bg-[#0f1420]/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl ring-1 ring-white/5">

          <h2 className="text-xl font-bold text-white mb-1">Iniciar sesión</h2>
          <p className="text-gray-500 text-xs mb-6 uppercase tracking-widest font-bold">Credenciales Institucionales</p>

          {apiError && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400 text-xs animate-shake">
              <FiAlertCircle className="shrink-0 scale-125" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">

            {/* Campo Email */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
                  <FiMail />
                </div>
                <input
                  type="email"
                  placeholder="nombre.apellido@upaep.mx"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/40 text-white placeholder-gray-600 border transition-all outline-none
                    ${errors.email ? "border-red-500/50 ring-2 ring-red-500/10" : "border-white/10 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5"}`}
                  {...register("email", {
                    required: "El correo es obligatorio",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Formato de correo no válido" },
                  })}
                />
              </div>
              {errors.email && <p className="mt-2 ml-1 text-[11px] font-bold text-red-400">{errors.email.message}</p>}
            </div>

            {/* Campo Password */}
            <div className="group">
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contraseña</label>
                {capsOn && (
                  <span className="text-[10px] font-black text-amber-500 uppercase animate-pulse">Caps Lock On</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
                  <FiLock />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  className={`w-full pl-11 pr-12 py-3.5 rounded-2xl bg-black/40 text-white placeholder-gray-600 border transition-all outline-none
                    ${errors.password ? "border-red-500/50 ring-2 ring-red-500/10" : "border-white/10 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5"}`}
                  {...register("password", { required: "La contraseña es obligatoria" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-2 ml-1 text-[11px] font-bold text-red-400">{errors.password.message}</p>}
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 group-hover:opacity-90 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Entrar al Portal</span>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
              Sistema de Acceso Restringido • SAPS 2026
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600 text-[11px]">
          ¿Olvidaste tus credenciales? Contacta a soporte técnico.
        </p>
      </div>
    </div>
  );
}