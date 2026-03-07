import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase"; // Ajusta la ruta a tu cliente
import { UserPlus, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";

const GestionEstudiantes = () => {
    const [loading, setLoading] = useState(false);
    const [estudiantes, setEstudiantes] = useState([]);
    const [formData, setFormData] = useState({
        nombre: "",
        formacion_lic: "",
        // Eliminamos el email porque la nueva tabla no lo necesita
    });
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchEstudiantes();
    }, []);

    const fetchEstudiantes = async () => {
        const { data, error } = await supabase
            // 1. Apuntamos a la nueva tabla
            .from("estudiantes_destacados")
            .select("*")
            // 2. Ordenamos por la columna correcta de esta tabla
            .order("creado_at", { ascending: false });

        if (error) {
            console.error("Error cargando estudiantes:", error);
        }
        setEstudiantes(data || []);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let fotoPath = null;

            // 1. Subir Foto al Storage
            if (file) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `estudiantes/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;
                fotoPath = filePath;
            }

            // 2. Insertar en la nueva tabla (mucho más limpio)
            const { error } = await supabase.from("estudiantes_destacados").insert([
                {
                    nombre: formData.nombre,
                    formacion_lic: formData.formacion_lic,
                    foto_storage_path: fotoPath,
                    visible: true,
                    // No mandamos ID (se genera solo) ni ROL ni EMAIL
                },
            ]);

            if (error) throw error;

            alert("Estudiante agregado con éxito");
            setFormData({ nombre: "", formacion_lic: "" }); // Reseteo limpio
            setFile(null);
            fetchEstudiantes();
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper para obtener la URL pública de la imagen de forma segura
    const getImageUrl = (path) => {
        return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <UserPlus className="text-blue-600" /> Registro de Estudiantes
            </h2>

            {/* Formulario */}
            <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-md border mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Licenciatura / Carrera</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            value={formData.formacion_lic}
                            onChange={(e) => setFormData({ ...formData, formacion_lic: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Foto del Estudiante</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">
                                        {file ? file.name : "Haz clic para subir imagen"}
                                    </p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                            </label>
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Guardar Estudiante"}
                </button>
            </form>

            {/* Lista de Estudiantes (Previsualización) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {estudiantes.map((est) => (
                    <div key={est.id} className="bg-gray-50 p-3 rounded-lg border text-center">
                        <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full mb-2 overflow-hidden border-2 border-blue-100">
                            {est.foto_storage_path ? (
                                <img
                                    // Usamos el helper en lugar de concatenar el import.meta.env
                                    src={getImageUrl(est.foto_storage_path)}
                                    className="w-full h-full object-cover"
                                    alt={est.nombre}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">Sin foto</div>
                            )}
                        </div>
                        <p className="font-bold text-sm truncate">{est.nombre}</p>
                        <p className="text-xs text-gray-500">{est.formacion_lic}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GestionEstudiantes;