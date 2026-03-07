import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { FaTrash, FaEye, FaEyeSlash, FaUpload } from "react-icons/fa";

export default function AdminColaboradores() {
    const [colaboradores, setColaboradores] = useState([]);
    const [nombre, setNombre] = useState("");
    const [archivoLogo, setArchivoLogo] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchColaboradores();
    }, []);

    const fetchColaboradores = async () => {
        const { data, error } = await supabase
            .from("colaboradores")
            .select("*")
            .order("creado_at", { ascending: false });
        if (!error) setColaboradores(data || []);
    };

    const handleSubirColaborador = async (e) => {
        e.preventDefault();
        if (!nombre || !archivoLogo) return alert("Completa todos los campos");
        setLoading(true);

        try {
            // 1. Subir logo a proyectos-assets/colaboradores/
            const fileExt = archivoLogo.name.split('.').pop();
            const fileName = `colaboradores/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("proyectos-assets")
                .upload(fileName, archivoLogo);

            if (uploadError) throw uploadError;

            // 2. Guardar en la base de datos
            const { error: dbError } = await supabase
                .from("colaboradores")
                .insert([{ nombre, logo_path: fileName, visible: true }]);

            if (dbError) throw dbError;

            // Limpiar y recargar
            setNombre("");
            setArchivoLogo(null);
            e.target.reset();
            fetchColaboradores();
        } catch (error) {
            console.error("Error al subir:", error);
            alert("Error al guardar el colaborador");
        } finally {
            setLoading(false);
        }
    };

    const toggleVisible = async (id, estadoActual) => {
        await supabase.from("colaboradores").update({ visible: !estadoActual }).eq("id", id);
        fetchColaboradores();
    };

    const eliminarColaborador = async (id, path) => {
        if (!window.confirm("¿Seguro que deseas eliminar este colaborador?")) return;

        // Borrar imagen del storage
        await supabase.storage.from("proyectos-assets").remove([path]);
        // Borrar registro
        await supabase.from("colaboradores").delete().eq("id", id);

        fetchColaboradores();
    };

    const getLogoUrl = (path) => supabase.storage.from("proyectos-assets").getPublicUrl(path).data.publicUrl;

    return (
        <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-8">
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gestión de Colaboradores</h2>
                <p className="text-sm text-gray-500 mt-1">Sube logos de universidades, empresas o aliados estratégicos.</p>
            </div>

            <form onSubmit={handleSubirColaborador} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre de la institución</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-600 outline-none transition-colors"
                        placeholder="Ej: Microsoft, UPAEP..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Logo (PNG transparente recomendado)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setArchivoLogo(e.target.files[0])}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 transition-all cursor-pointer"
                    />
                </div>
                <button
                    disabled={loading}
                    type="submit"
                    className="bg-white text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-full hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? "Subiendo..." : <><FaUpload /> Agregar Colaborador</>}
                </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 border-t border-white/5 pt-8">
                {colaboradores.map((colab) => (
                    <div key={colab.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between group">
                        <img
                            src={getLogoUrl(colab.logo_path)}
                            alt={colab.nombre}
                            className={`w-full h-16 object-contain mb-4 transition-all ${!colab.visible && 'opacity-30 grayscale'}`}
                        />
                        <p className="text-xs font-bold text-center truncate w-full mb-3">{colab.nombre}</p>
                        <div className="flex gap-2 w-full justify-center border-t border-white/10 pt-3">
                            <button
                                onClick={() => toggleVisible(colab.id, colab.visible)}
                                className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
                                title={colab.visible ? "Ocultar" : "Mostrar"}
                            >
                                {colab.visible ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
                            </button>
                            <button
                                onClick={() => eliminarColaborador(colab.id, colab.logo_path)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-white/5 rounded-full"
                                title="Eliminar"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}