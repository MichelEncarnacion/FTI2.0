// src/pages/ListadoPorClasif.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
// Importamos Supabase en lugar de axios
import { supabase } from "../lib/supabase";

export default function ListadoPorClasif() {
  const { slug } = useParams(); // p.ej. "trabajo-competitividad"
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProyectosSaps = async () => {
      if (!slug) return;
      setLoading(true);

      // Hacemos la consulta a proyectos y pedimos que traiga los datos del profesor
      // usando la relación con la tabla 'perfiles'
      const { data, error } = await supabase
        .from("proyectos")
        .select(`
          *,
          profesor:perfiles (
            nombre,
            foto_storage_path
          )
        `)
        // OJO: Cambia 'clasificacion' por el nombre real de tu columna en la tabla proyectos
        .eq("clasificacion", slug);

      if (error) {
        console.error("Error cargando proyectos SAPS:", error);
        setProyectos([]);
      } else {
        setProyectos(data || []);
      }

      setLoading(false);
    };

    fetchProyectosSaps();
  }, [slug]);

  // Helper para la foto del profesor desde Storage
  const getProfesorFoto = (path) => {
    if (!path) return "https://placehold.co/150x150?text=Prof";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("proyectos-assets").getPublicUrl(path).data.publicUrl;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold capitalize">
        {slug ? slug.replace(/-/g, " ") : "Clasificación"}
      </h2>

      {loading ? (
        <p className="text-gray-500">Cargando proyectos...</p>
      ) : proyectos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectos.map((p) => {
            // Extraemos los datos del profesor de forma segura
            const profesorNombre = p.profesor?.nombre || "Sin asignar";
            const profesorFoto = getProfesorFoto(p.profesor?.foto_storage_path);

            return (
              <Link
                key={p.id}
                to={`/proyecto/${p.id}`}
                className="flex items-center border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white text-black"
              >
                <img
                  src={profesorFoto}
                  alt={profesorNombre}
                  className="w-16 h-16 object-cover bg-gray-100"
                />
                <div className="flex-1 px-4 py-2">
                  <h3 className="font-semibold line-clamp-1" title={p.titulo}>
                    {p.titulo}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Prof. {profesorNombre}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 m-2 text-xs rounded-full ${p.estado === "activo"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {p.estado}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">No hay proyectos registrados en esta clasificación todavía.</p>
      )}
    </div>
  );
}