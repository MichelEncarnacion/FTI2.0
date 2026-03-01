// src/pages/SapsStem.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from "../context/AuthContext"; // <--- IMPORTANTE
import { FaArrowLeft, FaMicrochip, FaAtom } from 'react-icons/fa';
import stem from '../assets/stem.png';

export default function SapsStem() {
  const { user, profile, loading: authLoading } = useAuth(); // <--- Acceso a la sesión
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  // === 1. CONTROL DE ACCESO (PROTECCIÓN) ===
  useEffect(() => {
    if (!authLoading && user) {
      if (profile?.rol === 'administrador') {
        nav('/admin', { replace: true });
      } else if (profile?.rol === 'profesor') {
        nav('/prof', { replace: true });
      }
    }
  }, [user, profile, authLoading, nav]);

  // === 2. FETCH PROYECTOS STEM ===
  useEffect(() => {
    const fetchProyectos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('proyectos')
          .select(`
            *,
            profesor:perfiles (
              nombre,
              foto_storage_path
            )
          `)
          .eq('categoria', 'stem')
          .eq('estado', 'activo');

        if (error) throw error;
        setProyectos(data || []);
      } catch (error) {
        console.error("Error al cargar proyectos STEM:", error.message);
        setProyectos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProyectos();
  }, []);

  const getProfesorFoto = (path) => {
    if (!path) return "https://placehold.co/150x150?text=Prof";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("proyectos-assets").getPublicUrl(path).data.publicUrl;
  };

  // Evitamos parpadeo de contenido mientras verifica la sesión
  if (authLoading) return <div className="min-h-screen bg-[#050507]" />;

  return (
    <div className="min-h-screen bg-[#050507] text-gray-200 pb-20">

      {/* Botón de Regreso */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <button
          onClick={() => nav(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group mb-6 uppercase text-[10px] font-black tracking-widest"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Volver atrás
        </button>
      </div>

      {/* CABECERA STEM */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-[#0f1116] to-[#050507] shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-sky-600/5 blur-[100px] -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-12 relative z-10">
            <div className="md:col-span-8 p-8 md:p-12 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-sky-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter text-white">SAPS</span>
                <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <FaAtom className="animate-spin-slow" /> Innovación Científica
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Ciencia & <br /> <span className="text-sky-500">Ingeniería STEM</span>
              </h1>
              <p className="max-w-xl text-gray-400 text-sm md:text-base font-light leading-relaxed italic">
                "Ciencia, Tecnología, Ingeniería y Matemáticas para el bienestar social mediante la innovación responsable."
              </p>
            </div>

            <div className="md:col-span-4 bg-sky-600/10 flex items-center justify-center p-8 border-l border-white/5">
              <div className="relative group">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl group-hover:blur-3xl transition-all" />
                <img src={stem} alt="Icono STEM" className="relative h-32 w-32 object-contain drop-shadow-2xl brightness-110" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LISTADO DE PROYECTOS STEM */}
      <section className="max-w-7xl mx-auto px-6 mt-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="h-2 w-2 bg-sky-500 rounded-full shadow-[0_0_10px_#0ea5e9]" />
            Líneas de Investigación
          </h2>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{proyectos.length} Proyectos</span>
        </div>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 w-full bg-[#0f1116] rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : proyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-[#0a0a0f]">
            <FaMicrochip className="text-gray-700 text-5xl mb-4" />
            <p className="text-gray-400 font-medium tracking-tight">Cargando la próxima gran idea...</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {proyectos.map((p) => (
              <div
                key={p.id}
                onClick={() => nav(`/proyecto/${p.id}`)}
                className="group relative flex flex-col bg-[#0f1116] rounded-2xl border border-white/5 hover:border-sky-500/30 transition-all duration-500 shadow-xl cursor-pointer hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md">
                  <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">{p.grado || 'STEM'}</p>
                </div>

                <div className="h-44 w-full bg-black overflow-hidden relative">
                  {p.imagen_destacada_path ? (
                    <img
                      src={supabase.storage.from("proyectos-assets").getPublicUrl(p.imagen_destacada_path).data.publicUrl}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                      alt={p.titulo}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
                      <FaMicrochip className="text-gray-800 text-3xl" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1116] via-transparent to-transparent opacity-80" />
                </div>

                <div className="p-6 flex flex-col flex-grow space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProfesorFoto(p.profesor?.foto_storage_path)}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-sky-500/20 group-hover:ring-sky-500 transition-all"
                      alt="Prof"
                    />
                    <div className="flex flex-col truncate">
                      <p className="text-[11px] font-bold text-gray-300 truncate tracking-tight">{p.profesor?.nombre || 'Docente'}</p>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-white leading-tight group-hover:text-sky-400 transition-colors line-clamp-2">
                    {p.titulo}
                  </h3>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {p.tecnologias?.split(',').slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-[9px] font-black uppercase tracking-tighter bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-1 rounded-md">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-1 w-0 group-hover:w-full bg-sky-500 transition-all duration-500" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}