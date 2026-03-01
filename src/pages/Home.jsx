// src/pages/Home.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin, FaArrowRight, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import lab from "../assets/lab.jpg";

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const [proyectos, setProyectos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // <--- ESTADO PARA EL LIGHTBOX
  const nav = useNavigate();

  // === 1. CONTROL DE ACCESO ===
  useEffect(() => {
    if (!authLoading && user) {
      if (profile?.rol === 'administrador') {
        nav('/admin', { replace: true });
      } else if (profile?.rol === 'profesor') {
        nav('/prof', { replace: true });
      }
    }
  }, [user, profile, authLoading, nav]);

  // === 2. FETCH PROYECTOS ===
  useEffect(() => {
    const fetchProyectos = async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("*")
        .not("imagen_destacada_path", "is", null);
      if (error) console.error(error);
      else setProyectos(data || []);
    };
    fetchProyectos();
  }, []);

  // === 3. FETCH PROFESORES ===
  useEffect(() => {
    const fetchProfesores = async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("rol", "profesor")
        .eq("visible", true);
      if (error) console.error(error);
      else setProfesores(data || []);
    };
    fetchProfesores();
  }, []);

  // === 4. FETCH GALERÍA ===
  useEffect(() => {
    const fetchGaleria = async () => {
      try {
        const { data, error } = await supabase
          .from("galeria")
          .select("*")
          .order("creado_at", { ascending: false })
          .limit(8);

        if (error) throw error;
        setGaleria(data || []);
      } catch (error) {
        console.error("Error cargando galería:", error.message);
      }
    };
    fetchGaleria();
  }, []);

  // === LÓGICA DE CARRUSEL ===
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const cardRef = useRef(null);
  const xRef = useRef(0);
  const speedRef = useRef(0.6);
  const pausedRef = useRef(false);
  const rafRef = useRef(0);
  const cardFullWidthRef = useRef(352);

  useEffect(() => {
    const measure = () => {
      if (!cardRef.current || !trackRef.current) return;
      const w = cardRef.current.getBoundingClientRect().width;
      const gap = parseInt(window.getComputedStyle(trackRef.current).gap) || 32;
      cardFullWidthRef.current = w + gap;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [proyectos.length]);

  useEffect(() => {
    if (proyectos.length <= 1) return;
    const loopWidth = cardFullWidthRef.current * proyectos.length;
    const step = () => {
      if (!pausedRef.current) {
        xRef.current -= speedRef.current;
        if (-xRef.current >= loopWidth) xRef.current += loopWidth;
        if (trackRef.current) trackRef.current.style.transform = `translateX(${xRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [proyectos.length]);

  const handleManualScroll = (direction) => {
    const loopWidth = cardFullWidthRef.current * proyectos.length;
    const moveAmount = cardFullWidthRef.current;
    if (direction === "next") xRef.current -= moveAmount;
    else xRef.current += moveAmount;
    if (-xRef.current >= loopWidth) xRef.current += loopWidth;
    if (xRef.current > 0) xRef.current -= loopWidth;
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
      trackRef.current.style.transform = `translateX(${xRef.current}px)`;
      setTimeout(() => { if (trackRef.current) trackRef.current.style.transition = "none"; }, 500);
    }
  };

  const imgUrl = (path) => supabase.storage.from("proyectos-assets").getPublicUrl(path).data.publicUrl;
  const duplicated = useMemo(() => proyectos.concat(proyectos.map((p, i) => ({ ...p, __clone: i }))), [proyectos]);

  if (authLoading) return <div className="bg-[#050507] min-h-screen" />;

  return (
    <div className="flex flex-col overflow-x-hidden w-full bg-[#050507] text-white">

      {/* HERO SECTION */}
      <section className="relative w-full h-[85vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${lab})`, filter: 'brightness(0.4)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block px-3 py-1 bg-red-600/20 border border-red-600/30 text-red-500 text-xs font-bold tracking-[0.2em] uppercase rounded-full">
              Innovación Universitaria
            </span>
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter text-white">
              Iniciativa <span className="text-red-600">LumAcad</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed font-light">
              Selección de proyectos desarrollados por estudiantes de la Facultad de Tecnologías de la Información y Ciencia de Datos de la UPAEP.
            </p>
            <div className="pt-4">
              <button onClick={() => document.getElementById('proyectos').scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-red-600 hover:text-white transition-all duration-300 group">
                Explorar Proyectos <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CARRUSEL PROYECTOS */}
      <section id="proyectos" className="py-24 bg-[#050507]">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">Proyectos Destacados</h2>
            <div className="h-1 w-20 bg-red-600 mt-2" />
          </div>
          <div className="flex gap-4">
            <button onClick={() => handleManualScroll("prev")} className="p-4 rounded-full border border-white/10 bg-white/5 hover:bg-red-600 transition-all active:scale-90"><FaChevronLeft size={14} /></button>
            <button onClick={() => handleManualScroll("next")} className="p-4 rounded-full border border-white/10 bg-white/5 hover:bg-red-600 transition-all active:scale-90"><FaChevronRight size={14} /></button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
          onMouseEnter={() => pausedRef.current = true}
          onMouseLeave={() => pausedRef.current = false}
        >
          <div ref={trackRef} className="flex gap-8 py-4 transition-none">
            {duplicated.map((p, idx) => (
              <a
                key={p.__clone != null ? `clone-${p.id}-${p.__clone}` : p.id}
                href={`/proyecto/${p.id}`}
                onClick={(e) => { e.preventDefault(); nav(`/proyecto/${p.id}`); }}
                ref={idx === 0 ? cardRef : null}
                className="group relative flex-shrink-0 w-80 rounded-2xl bg-[#12121a] overflow-hidden border border-white/5 hover:border-red-600/50 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="h-48 overflow-hidden">
                  <img src={imgUrl(p.imagen_destacada_path)} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6 space-y-3">
                  <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">{p.anio || 'PROYECTO'}</span>
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-red-500 transition-colors">{p.titulo}</h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN DE GALERÍA (Con Lightbox) */}
      <section className="py-24 bg-[#050507] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight">Vida Universitaria</h2>
          <div className="h-1 w-20 bg-red-600 mt-2 mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Haz clic en una imagen para ampliarla.</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {galeria.map((foto) => (
            <div
              key={foto.id}
              onClick={() => setSelectedImage(foto)}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-[#12121a] border border-white/5 cursor-zoom-in"
            >
              <img
                src={foto.url}
                alt={foto.titulo}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest">Ver foto</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPONENTE LIGHTBOX (MODAL) */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[110]"
            onClick={() => setSelectedImage(null)}
          >
            <FaTimes size={24} />
          </button>

          <div
            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.titulo}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            />
            <div className="mt-6 text-center">
              <h4 className="text-xl font-bold text-white uppercase tracking-tighter italic">{selectedImage.titulo}</h4>
              <p className="text-red-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Facultad de T.I. - UPAEP</p>
            </div>
          </div>
        </div>
      )}

      {/* PROFESORES */}
      <section className="py-24 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl font-black uppercase tracking-tight">Cuerpo Académico</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm mt-4">Docentes que impulsan el futuro tecnológico.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {profesores.map((p) => (
            <div key={p.id} className="relative group aspect-[3/4] rounded-3xl overflow-hidden bg-[#12121a] border border-white/5">
              <img src={p.foto_storage_path ? imgUrl(p.foto_storage_path) : "https://placehold.co/600x800"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={p.nombre} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 w-full p-6">
                <div className="bg-red-600 text-white p-4 rounded-xl">
                  <h3 className="text-sm font-black uppercase truncate">{p.nombre}</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-80 mt-1 font-bold">Líder Académico</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-gray-400 pt-20 pb-10 w-full border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center md:text-left">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">LumAcad<span className="text-red-600">.</span></h2>
            <p className="text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              Inspirando conocimiento, creando soluciones.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-xs">Navegación</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#proyectos" className="hover:text-red-500 transition-colors">Proyectos</a></li>
              <li><a href="/about" className="hover:text-red-500 transition-colors">Sobre Nosotros</a></li>
            </ul>
          </div>
          <div className="space-y-6 md:text-right">
            <div className="flex justify-center md:justify-end gap-3">
              {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-red-600 transition-all">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}