import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Trash2, ImageIcon, Loader2, PlusCircle, X, Check } from 'lucide-react';

export default function GaleriaAdmin() {
    const [imagenes, setImagenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Estados para el flujo de subida con texto
    const [selectedFile, setSelectedFile] = useState(null);
    const [nuevoTitulo, setNuevoTitulo] = useState("");

    const BUCKET_NAME = 'fotos-galeria';

    useEffect(() => {
        fetchImagenes();
    }, []);

    const fetchImagenes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('galeria')
                .select('*')
                .order('creado_at', { ascending: false });

            if (error) throw error;
            setImagenes(data || []);
        } catch (error) {
            console.error('Error cargando base de datos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Al seleccionar archivo, abrimos el "mini-formulario"
    const onFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida.');
            return;
        }
        setSelectedFile(file);
        setNuevoTitulo(file.name.split('.')[0]); // Default: nombre del archivo
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            // A. Subir al Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            // B. URL Pública
            const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            // C. Datos del Admin
            const { data: { user } } = await supabase.auth.getUser();

            // D. Insertar con el título personalizado
            const { error: dbError } = await supabase
                .from('galeria')
                .insert([
                    {
                        url: urlData.publicUrl,
                        titulo: nuevoTitulo || "Sin título",
                        admin_id: user?.id
                    }
                ]);

            if (dbError) throw dbError;

            // Limpiar estados y recargar
            setSelectedFile(null);
            setNuevoTitulo("");
            fetchImagenes();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteImagen = async (id, url) => {
        if (!window.confirm('¿Eliminar esta imagen?')) return;
        try {
            const fileName = url.split('/').pop();
            const { error: dbError } = await supabase.from('galeria').delete().eq('id', id);
            if (dbError) throw dbError;

            await supabase.storage.from(BUCKET_NAME).remove([fileName]);
            setImagenes(imagenes.filter((img) => img.id !== id));
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    };

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <ImageIcon className="text-indigo-500" size={24} />
                        Gestión de Galería
                    </h3>
                    <p className="text-slate-400 text-sm italic">Sube momentos y asígnales un título.</p>
                </div>

                {!selectedFile ? (
                    <label className="cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                        <PlusCircle size={18} />
                        Nueva Imagen
                        <input type="file" className="hidden" onChange={onFileSelect} accept="image/*" />
                    </label>
                ) : (
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-indigo-100 animate-in slide-in-from-right-4">
                        <input
                            type="text"
                            value={nuevoTitulo}
                            onChange={(e) => setNuevoTitulo(e.target.value)}
                            placeholder="Escribe un título..."
                            className="bg-white border-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2 text-sm font-medium w-48 md:w-64"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                        </button>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="bg-slate-200 text-slate-600 p-2 rounded-xl hover:bg-slate-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* GRID */}
            {loading ? (
                <div className="flex justify-center py-20 text-slate-300 font-bold uppercase text-xs tracking-widest">Cargando...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {imagenes.map((img) => (
                        <div key={img.id} className="group relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200 transition-all hover:shadow-2xl">
                            <img src={img.url} alt={img.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-6">
                                <p className="text-white text-xs font-black uppercase mb-4 tracking-tighter text-center">{img.titulo}</p>
                                <button
                                    onClick={() => deleteImagen(img.id, img.url)}
                                    className="bg-white/10 backdrop-blur-md text-white border border-white/20 p-3 rounded-2xl hover:bg-rose-500 hover:border-rose-500 transition-all transform hover:scale-110"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}