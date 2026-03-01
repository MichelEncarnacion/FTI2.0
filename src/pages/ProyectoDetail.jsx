// src/pages/ProyectoDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext"; // <--- IMPORTANTE
import Slider from "react-slick";
import { FaArrowLeft, FaArrowRight, FaChalkboardTeacher, FaTools, FaLightbulb } from "react-icons/fa";

export default function ProyectoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth(); // <--- Acceso a la sesión
  const [proyecto, setProyecto] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);

  // === 1. CONTROL DE ACCESO (PROTECCIÓN) ===
  useEffect(() => {
    if (!authLoading && user) {
      if (profile?.rol === 'administrador') {
        navigate('/admin', { replace: true });
      } else if (profile?.rol === 'profesor') {
        navigate('/prof', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

  // === 2. FETCH DETALLES DEL PROYECTO ===
  useEffect(() => {
    const fetchProyectoDetails = async () => {
      setLoading(true);
      const { data: projData, error: projError } = await supabase
        .from("proyectos")
        .select(`*, profesor:perfiles (nombre, foto_storage_path)`)
        .eq("id", id)
        .single();

      if (projError) console.error("Error:", projError);
      else setProyecto(projData);

      const { data: imgData, error: imgError } = await supabase
        .from("proyecto_imagenes")
        .select("*")
        .eq("proyecto_id", id);

      if (imgError) console.error("Error imágenes:", imgError);
      else setImagenes(imgData || []);

      setLoading(false);
    };
    if (id) fetchProyectoDetails();
  }, [id]);

  const getImageUrl = (path) => {
    if (!path) return null;
    return supabase.storage.from("proyectos-assets").getPublicUrl(path).data.publicUrl;
  };

  // Loader refinado
  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-red-600/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-red-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-xs font-black tracking-[0.3em] uppercase opacity-50">SAPS / Cargando</p>
    </div>
  );

  if (!proyecto) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white italic">
      <p>Proyecto no encontrado.</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-red-500 hover:underline">Regresar</button>
    </div>
  );

  const { titulo, descripcion, objetivo, tecnologias, estado, categoria, grado, profesor, imagen_destacada_path } = proyecto;

  const galeriaFinal = imagenes.length > 0
    ? imagenes.map(img => getImageUrl(img.storage_path))
    : imagen_destacada_path ? [getImageUrl(imagen_destacada_path)] : [];

  const settings = {
    dots: true,
    infinite: galeriaFinal.length > 1,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    appendDots: dots => <div style={{ bottom: "20px" }}><ul> {dots} </ul></div>,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pb-20">
      {/* HEADER FIJO / NAV */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            VOLVER
          </button>
          <div className="text-xs font-mono text-red-500 tracking-tighter hidden sm:block">
            ID-PROYECTO: {id.slice(0, 8)}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* COLUMNA IZQUIERDA: VISUAL & CONTENIDO */}
          <div className="lg:col-span-8 space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-wider">
                  {categoria?.replace(/-/g, ' ')}
                </span>
                <span className="bg-white/10 text-gray-300 text-[10px] font-bold px-3 py-1 rounded-sm border border-white/10">
                  GRADO: {grado}
                </span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-sm border ${estado === 'activo' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}>
                  ● {estado?.toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
                {titulo}
              </h1>
            </header>

            {/* Galería Premium */}
            <section className="relative rounded-2xl overflow-hidden bg-gray-900 border border-white/5 shadow-2xl">
              {galeriaFinal.length > 0 ? (
                <Slider {...settings}>
                  {galeriaFinal.map((url, i) => (
                    <div key={i} className="outline-none">
                      <div className="aspect-video w-full">
                        <img src={url} alt="Galería" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="aspect-video flex items-center justify-center text-gray-600 bg-[#0f1116] italic">
                  Sin imágenes disponibles
                </div>
              )}
            </section>

            {/* Cuerpo del Texto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="bg-[#0f1116] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-4 text-red-500">
                  <FaLightbulb />
                  <h3 className="font-black uppercase tracking-widest text-sm">Problema</h3>
                </div>
                <p className="text-gray-400 leading-relaxed text-base whitespace-pre-line">
                  {descripcion}
                </p>
              </div>

              <div className="bg-[#0f1116] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-4 text-red-500">
                  <FaTools />
                  <h3 className="font-black uppercase tracking-widest text-sm">Objetivo</h3>
                </div>
                <p className="text-gray-400 leading-relaxed text-base whitespace-pre-line">
                  {objetivo}
                </p>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Card del Profesor */}
            <div className="bg-gradient-to-b from-[#111] to-black p-1 rounded-3xl border border-white/10 shadow-xl">
              <div className="bg-[#0a0a0a] rounded-[calc(1.5rem-1px)] p-6">
                <div className="flex items-center gap-2 mb-6 text-gray-500">
                  <FaChalkboardTeacher />
                  <span className="text-xs font-bold uppercase tracking-widest">Responsable Académico</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img
                      src={getImageUrl(profesor?.foto_storage_path) || "https://placehold.co/200"}
                      className="w-32 h-32 rounded-2xl object-cover grayscale hover:grayscale-0 transition-all duration-500 border border-white/10"
                      alt="Docente"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center border-4 border-[#0a0a0a]">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">
                    {profesor?.nombre || "Catedrático SAPS"}
                  </h4>
                  <p className="text-gray-500 text-sm mt-1 uppercase font-medium">Líder de Proyecto</p>
                </div>
              </div>
            </div>

            {/* Card de Tecnologías */}
            <div className="bg-[#0f1116] p-6 rounded-3xl border border-white/5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Stack Tecnológico</h3>
              <div className="flex flex-wrap gap-2">
                {tecnologias?.split(',').map((t, i) => (
                  <span key={i} className="px-3 py-2 bg-black text-gray-300 text-[11px] font-bold rounded-lg border border-white/5 hover:border-red-500/50 transition-colors">
                    {t.trim().toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Info Extra */}
            <div className="p-6 rounded-3xl border border-dashed border-white/10 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                Este proyecto es parte del ecosistema SAPS enfocado en la innovación y el desarrollo sostenible.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// BOTONES DE NAVEGACIÓN SLIDER
function PrevArrow({ onClick }) {
  return (
    <button onClick={onClick} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-sm p-3 rounded-full border border-white/10 hover:bg-red-600 hover:border-red-600 transition-all shadow-xl group">
      <FaArrowLeft className="text-white text-sm group-hover:-translate-x-0.5 transition-transform" />
    </button>
  );
}

function NextArrow({ onClick }) {
  return (
    <button onClick={onClick} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/80 backdrop-blur-sm p-3 rounded-full border border-white/10 hover:bg-red-600 hover:border-red-600 transition-all shadow-xl group">
      <FaArrowRight className="text-white text-sm group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}