// src/components/UploadFoto.jsx
import { useRef, useState } from "react";
// Importamos Supabase en lugar de axios
import { supabase } from "../lib/supabase";

export default function UploadFoto({ onDone }) {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();

  // Función que sube el archivo a Supabase Storage
  const uploadFile = async (file) => {
    if (!file) return;
    setLoading(true);

    try {
      // 1. Obtenemos al usuario actual para organizar las carpetas
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Usuario no autenticado");

      // 2. Creamos un nombre de archivo único para evitar colisiones
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `perfiles/${user.id}/${fileName}`;

      // 3. Subimos el archivo al bucket "proyectos-assets"
      const { data, error } = await supabase.storage
        .from("proyectos-assets")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // false para no sobreescribir si por milagro se repite el nombre
        });

      if (error) throw error;

      // 4. Devolvemos el path (ej: perfiles/123/168...jpg) a la función onDone del Dashboard
      onDone(data.path);
    } catch (error) {
      console.error("Error al subir la foto:", error);
      alert("Hubo un error al subir la foto. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
      setIsDragging(false);
    }
  };

  // Handlers de drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
    e.dataTransfer.clearData();
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  // Handler de selección clásica
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Limpiamos el input por si el usuario quiere subir el mismo archivo después
    e.target.value = null;
  };

  return (
    <div className="px-4 py-2">
      <div
        className={`w-full h-40 flex items-center justify-center text-center
          border-2 border-dashed rounded-lg cursor-pointer transition-all
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-500'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !loading && fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {loading ? (
          <span className="text-gray-500 font-semibold animate-pulse">Subiendo a la nube...</span>
        ) : (
          <span className="text-gray-600">
            Arrastra y suelta tu foto aquí<br />
            o haz clic para seleccionar
          </span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}