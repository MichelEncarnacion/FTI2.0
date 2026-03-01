// src/pages/prof/NuevoProyecto.jsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { useDropzone } from "react-dropzone";
import { supabase } from "../../lib/supabase";

export default function NuevoProyecto() {
  const [archivos, setArchivos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const { register, handleSubmit, control } = useForm();
  const nav = useNavigate();

  const opcionesClasifs = [
    { value: 'trabajo-competitividad', label: 'Trabajo y Competitividad' },
    { value: 'stem', label: 'STEM (Ciencia, Tecnología, Ing. y Mates)' },
    { value: 'vida-salud', label: 'Vida y Salud' },
    { value: 'desarrollo-humano', label: 'Desarrollo Humano' }
  ];

  const onDrop = (acceptedFiles) => {
    setArchivos(prev => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    onDrop
  });

  const onSubmit = async data => {
    setFeedback({ type: "", msg: "" });
    setIsSaving(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Usuario no autenticado");

      // --- CAMBIOS CLAVE AQUÍ PARA COINCIDIR CON TU SQL ---
      const nuevoProyecto = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        objetivo: data.objetivo,
        tecnologias: data.tecnologias,
        grado: data.grado,
        categoria: data.clasif_id, // ANTES: clasificacion | AHORA: categoria (según tu SQL)
        profesor_id: user.id,
        estado: 'activo' // Asegúrate de que 'activo' sea un valor válido en tu enum 'estado_proyecto'
      };

      const { data: insertedProj, error: insertError } = await supabase
        .from("proyectos")
        .insert([nuevoProyecto])
        .select()
        .single();

      if (insertError) throw insertError;

      const proyectoId = insertedProj.id;

      if (archivos.length > 0) {
        let primeraImagenPath = null;

        for (const file of archivos) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `proyectos/${proyectoId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("proyectos-assets")
            .upload(filePath, file);

          if (!uploadError) {
            if (!primeraImagenPath) primeraImagenPath = filePath;

            await supabase.from("proyecto_imagenes").insert({
              proyecto_id: proyectoId,
              storage_path: filePath
            });
          }
        }

        if (primeraImagenPath) {
          // --- OTRO CAMBIO CLAVE ---
          await supabase
            .from("proyectos")
            .update({ imagen_destacada_path: primeraImagenPath }) // ANTES: imagen_destacada | AHORA: imagen_destacada_path
            .eq("id", proyectoId);
        }
      }

      nav("/prof");
    } catch (err) {
      console.error("Error al guardar:", err);
      setFeedback({
        type: "error",
        msg: err.message || "Hubo un error al crear el proyecto."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "w-full border border-gray-300 px-3 py-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white";

  return (
    <div className="w-screen min-h-screen bg-gray-50 flex items-start justify-center p-4 py-10 text-black">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-3xl bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-8 pb-4 border-b border-gray-100">
          <button type="button" onClick={() => nav("/prof")} className="p-2 mr-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 flex-1">Nuevo Proyecto</h2>
        </div>

        {feedback.msg && (
          <div className={`mb-6 p-4 rounded-md text-sm font-medium ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {feedback.type === 'error' ? '⚠️ ' : '✅ '} {feedback.msg}
          </div>
        )}

        <div className="space-y-5 mb-8">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">Título</label>
            <input {...register("titulo", { required: true })} className={inputClasses} placeholder="Ej. Sistema de Inventario..." />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">Descripción</label>
            <textarea {...register("descripcion")} rows={3} className={inputClasses} placeholder="Detalla de qué trata el proyecto..." />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">Objetivo</label>
            <textarea {...register("objetivo")} rows={2} className={inputClasses} placeholder="¿Qué problema resuelve?" />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">Tecnologías</label>
            <input {...register("tecnologias")} className={inputClasses} placeholder="React, Node, etc." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">Grado Académico</label>
            <select {...register("grado", { required: true })} className={inputClasses} defaultValue="Licenciatura">
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
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={opcionesClasifs}
                  placeholder="Selecciona..."
                  onChange={opt => field.onChange(opt?.value)}
                  value={opcionesClasifs.find(o => o.value === field.value) || null}
                  classNamePrefix="react-select"
                />
              )}
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block mb-1.5 text-sm font-semibold text-gray-700">Imágenes</label>
          <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
            <input {...getInputProps()} />
            <p className="text-sm text-gray-600">Sube las fotos del proyecto aquí</p>
          </div>
          {archivos.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
              {archivos.length} archivo(s) seleccionados.
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
        >
          {isSaving ? "Guardando..." : "Crear Proyecto"}
        </button>
      </form>
    </div>
  );
}