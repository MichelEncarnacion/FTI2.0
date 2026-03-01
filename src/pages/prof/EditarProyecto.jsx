// src/pages/prof/EditarProyecto.jsx
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import Dropzone from "react-dropzone";
import { supabase } from "../../lib/supabase";

export default function EditarProyecto() {
  const { id } = useParams();
  const nav = useNavigate();

  const [imagenes, setImagenes] = useState([]); // Imágenes ya guardadas en DB
  const [archivos, setArchivos] = useState([]); // Archivos nuevos seleccionados en el PC
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const { register, handleSubmit, reset, control, watch, setValue } = useForm();

  const opcionesClasifs = [
    { value: 'trabajo-competitividad', label: 'Trabajo y Competitividad' },
    { value: 'stem', label: 'STEM (Ciencia, Tecnología, Ing. y Mates)' },
    { value: 'vida-salud', label: 'Vida y Salud' },
    { value: 'desarrollo-humano', label: 'Desarrollo Humano' }
  ];

  const imagenDestacadaActual = watch("imagen_destacada_path");

  useEffect(() => {
    async function loadData() {
      try {
        const { data: proj, error: pError } = await supabase
          .from("proyectos")
          .select("*")
          .eq("id", id)
          .single();

        if (pError) throw pError;

        if (proj) {
          reset({
            titulo: proj.titulo,
            descripcion: proj.descripcion,
            objetivo: proj.objetivo,
            tecnologias: proj.tecnologias,
            grado: proj.grado,
            clasif_id: proj.categoria,
            imagen_destacada_path: proj.imagen_destacada_path
          });
        }

        const { data: imgData } = await supabase
          .from("proyecto_imagenes")
          .select("*")
          .eq("proyecto_id", id);

        if (imgData) setImagenes(imgData);

      } catch (e) {
        console.error("Error al cargar datos:", e);
        setFeedback({ type: "error", msg: "No se pudieron cargar los datos." });
      }
    }
    loadData();
  }, [id, reset]);

  const getImageUrl = (path) => {
    if (!path) return "";
    return supabase.storage.from("proyectos-assets").getPublicUrl(path).data.publicUrl;
  };

  const onSubmit = async data => {
    setFeedback({ type: "", msg: "" });
    setIsSaving(true);

    try {
      // 1. Actualizar datos básicos
      const { error: updateError } = await supabase
        .from("proyectos")
        .update({
          titulo: data.titulo,
          descripcion: data.descripcion,
          objetivo: data.objetivo,
          tecnologias: data.tecnologias,
          grado: data.grado,
          categoria: data.clasif_id,
          imagen_destacada_path: data.imagen_destacada_path,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Subir archivos nuevos si existen
      if (archivos.length > 0) {
        for (const file of archivos) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `proyectos/${id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("proyectos-assets")
            .upload(filePath, file);

          if (!uploadError) {
            await supabase.from("proyecto_imagenes").insert({
              proyecto_id: id,
              storage_path: filePath
            });
          }
        }
      }

      nav("/prof");
    } catch (e) {
      console.error("Error al guardar:", e);
      setFeedback({ type: "error", msg: "Error al guardar los cambios." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteImage = async (imgId, storagePath) => {
    if (!window.confirm("¿Eliminar esta imagen definitivamente?")) return;
    try {
      // Borrar de la base de datos
      const { error: dbError } = await supabase
        .from("proyecto_imagenes")
        .delete()
        .eq("id", imgId);

      if (dbError) throw dbError;

      // Borrar del Storage
      if (storagePath) {
        await supabase.storage.from("proyectos-assets").remove([storagePath]);
      }

      // Sincronizar: Si era la portada, limpiar el campo en el form
      if (imagenDestacadaActual === storagePath) {
        setValue("imagen_destacada_path", "");
      }

      // Actualizar interfaz reactivamente
      setImagenes(prev => prev.filter(img => img.id !== imgId));
      setFeedback({ type: "success", msg: "Imagen eliminada con éxito." });
    } catch (e) {
      setFeedback({ type: "error", msg: "Error al intentar eliminar la imagen." });
    }
  };

  const inputClasses = "w-full border border-gray-300 px-3 py-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white";

  return (
    <div className="w-screen min-h-screen bg-gray-50 flex items-start justify-center p-4 py-10 text-black">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-3xl bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">

        {/* ENCABEZADO */}
        <div className="flex items-center mb-8 pb-4 border-b">
          <button type="button" onClick={() => nav("/prof")} className="p-2 mr-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Editar Proyecto</h2>
        </div>

        {/* FEEDBACK MENSAJES */}
        {feedback.msg && (
          <div className={`mb-6 p-4 rounded-md text-sm font-medium ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {feedback.msg}
          </div>
        )}

        {/* CAMPOS DE TEXTO */}
        <div className="space-y-5 mb-8">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">Título</label>
            <input {...register("titulo", { required: true })} className={inputClasses} />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">Descripción</label>
            <textarea {...register("descripcion")} rows={3} className={inputClasses} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">Grado</label>
              <select {...register("grado", { required: true })} className={inputClasses}>
                <option value="Licenciatura">Licenciatura</option>
                <option value="Maestría">Maestría</option>
                <option value="Doctorado">Doctorado</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">Categoría SAPS</label>
              <Controller
                name="clasif_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={opcionesClasifs}
                    onChange={opt => field.onChange(opt?.value)}
                    value={opcionesClasifs.find(o => o.value === field.value)}
                    classNamePrefix="react-select"
                    placeholder="Seleccionar..."
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* GALERÍA GUARDADA Y PORTADA */}
        <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-md font-bold text-gray-800 mb-4">Galería del Proyecto</h3>

          {imagenes.length > 0 ? (
            <>
              <div className="mb-6">
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">Elegir Imagen de Portada</label>
                <select {...register("imagen_destacada_path")} className={inputClasses}>
                  <option value="">— Sin portada —</option>
                  {imagenes.map(img => (
                    <option key={img.id} value={img.storage_path}>
                      Imagen: {img.storage_path.split('/').pop()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {imagenes.map(img => (
                  <div key={img.id} className={`relative rounded-lg overflow-hidden border-2 transition-all ${imagenDestacadaActual === img.storage_path ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-gray-200'}`}>
                    <img src={getImageUrl(img.storage_path)} className="w-full h-24 object-cover" alt="Proyecto" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id, img.storage_path)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md"
                      title="Eliminar imagen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    {imagenDestacadaActual === img.storage_path && (
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] text-center font-bold py-0.5">PORTADA</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-4">No hay imágenes guardadas aún.</p>
          )}
        </div>

        {/* DROPZONE PARA NUEVAS IMÁGENES */}
        <div className="mb-8">
          <label className="block mb-1.5 text-sm font-semibold text-gray-700">Añadir nuevas imágenes</label>
          <Dropzone onDrop={(acc) => setArchivos(prev => [...prev, ...acc])} accept={{ 'image/*': [] }}>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <p className="text-sm text-gray-600 font-medium">{isDragActive ? "Suelta aquí..." : "Arrastra imágenes nuevas o haz clic aquí"}</p>
                </div>
              </div>
            )}
          </Dropzone>

          {/* LISTA DE ARCHIVOS POR SUBIR */}
          {archivos.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Archivos listos para subir ({archivos.length}):</p>
              {archivos.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-blue-100 p-2 rounded-md shadow-sm">
                  <span className="text-xs text-gray-700 truncate max-w-[80%] italic">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setArchivos(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 text-xs font-bold hover:underline ml-2"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTÓN SUBMIT */}
        <div className="pt-6 border-t">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Guardando cambios...
              </span>
            ) : "Guardar Proyecto"}
          </button>
        </div>
      </form>
    </div>
  );
}