// src/pages/prof/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import UploadFoto from "../../components/UploadFoto.jsx";

export default function Dashboard() {
  const [prof, setProf] = useState(null);
  const [proyectos, setProyectos] = useState([]);

  // Estados para contraseña
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [repPass, setRepPass] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [passFeedback, setPassFeedback] = useState({ type: "", msg: "" });

  const nav = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        nav("/login");
        return;
      }

      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (perfilData) {
        setProf({ ...perfilData, email: user.email });
      }

      const { data: proyectosData } = await supabase
        .from("proyectos")
        .select("*")
        .eq("profesor_id", user.id)
        .order("created_at", { ascending: false });

      if (proyectosData) {
        setProyectos(proyectosData);
      }
    };

    loadDashboardData();
  }, [nav]);

  // --- NUEVA FUNCIÓN DE LOGOUT ---
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      nav("/login"); // Redirige al login tras cerrar sesión
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }

  // Cambiar estado del proyecto (Activo/Inactivo)
  async function toggleEstado(id) {
    try {
      const proyecto = proyectos.find(p => p.id === id);
      const nuevoEstado = String(proyecto.estado).toLowerCase() === "activo" ? "inactivo" : "activo";

      const { error } = await supabase
        .from("proyectos")
        .update({ estado: nuevoEstado })
        .eq("id", id);

      if (error) throw error;

      setProyectos(ps =>
        ps.map(p => (p.id === id ? { ...p, estado: nuevoEstado } : p))
      );
    } catch (e) {
      console.error("Error al cambiar estado:", e);
      alert("No se pudo cambiar el estado del proyecto.");
    }
  }

  // Eliminar proyecto

  async function handleDelete(id) {
    if (window.confirm("¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.")) {
      try {
        // Obtenemos el usuario actual para asegurar la condición
        const { data: { user } } = await supabase.auth.getUser();

        const { error, count } = await supabase
          .from("proyectos")
          .delete()
          .eq("id", id)
          .eq("profesor_id", user.id); // Seguridad extra: solo borra si le pertenece

        if (error) throw error;

        // Si no hubo error pero no se borró nada (count 0), avisamos
        setProyectos(ps => ps.filter(x => x.id !== id));

      } catch (e) {
        console.error("Error al eliminar proyecto:", e);
        alert("Hubo un error al eliminar el proyecto: " + e.message);
      }
    }
  }
  // Actualizar Contraseña
  async function handleUpdatePassword() {
    setPassFeedback({ type: "", msg: "" });

    if (!currPass || !newPass || !repPass) {
      setPassFeedback({ type: "error", msg: "Completa todos los campos" });
      return;
    }
    if (newPass.length < 8) {
      setPassFeedback({ type: "error", msg: "La nueva contraseña debe tener al menos 8 caracteres" });
      return;
    }
    if (newPass !== repPass) {
      setPassFeedback({ type: "error", msg: "Las contraseñas no coinciden" });
      return;
    }

    try {
      setLoadingPass(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: prof.email,
        password: currPass,
      });

      if (signInError) throw new Error("La contraseña actual es incorrecta");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass
      });

      if (updateError) throw updateError;

      setPassFeedback({ type: "success", msg: "Contraseña actualizada exitosamente" });
      setCurrPass("");
      setNewPass("");
      setRepPass("");
    } catch (e) {
      setPassFeedback({ type: "error", msg: e.message || "Error al actualizar la contraseña" });
    } finally {
      setLoadingPass(false);
    }
  }

  // Actualizar foto de perfil
  async function handleFotoActualizada(path) {
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ foto_storage_path: path })
        .eq("id", prof.id);

      if (!error) {
        setProf(p => ({ ...p, foto_storage_path: path }));
      }
    } catch (e) {
      console.error("Error al guardar la foto:", e);
    }
  }

  const getProfesorFoto = (path) => {
    if (!path) return "https://placehold.co/150x150?text=Prof";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("proyectos-assets").getPublicUrl(path).data.publicUrl;
  };

  if (!prof) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen p-6 space-y-10 bg-gray-50">

      {/* PERFIL */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-start gap-6">
        <img
          src={getProfesorFoto(prof.foto_storage_path)}
          alt={prof.nombre}
          className="w-24 h-24 rounded-full object-cover shadow-sm bg-gray-200 shrink-0"
        />
        <div className="flex-1 space-y-4 w-full">
          {/* Aquí agregamos el botón de Logout alineado a la derecha */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{prof.nombre}</h1>
              <p className="text-gray-500">{prof.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-4">
            <div>
              <h2 className="font-semibold text-gray-900">Formación académica</h2>
              <p className="text-gray-600 mt-1">{prof.formacion_lic || 'No especificada'}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Maestría</h2>
              <p className="text-gray-600 mt-1">{prof.formacion_mtr || 'No especificada'}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Doctorado</h2>
              <p className="text-gray-600 mt-1">{prof.formacion_doc || 'No especificada'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* RESTO DEL CONTENIDO (FOTO Y CONTRASEÑA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actualizar foto de perfil</h2>
          <UploadFoto
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            onDone={handleFotoActualizada}
          />
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actualizar contraseña</h2>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña actual"
              value={currPass}
              onChange={e => setCurrPass(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="Nueva contraseña (min 8)"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <input
                type="password"
                placeholder="Repite la nueva"
                value={repPass}
                onChange={e => setRepPass(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleUpdatePassword}
              disabled={loadingPass}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 transition-colors w-full sm:w-auto"
            >
              {loadingPass ? "Guardando…" : "Guardar cambios"}
            </button>
            {passFeedback.msg && (
              <span className={`text-sm font-medium ${passFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {passFeedback.type === 'success' ? '✅ ' : '⚠️ '}{passFeedback.msg}
              </span>
            )}
          </div>
        </section>
      </div>

      {/* MIS PROYECTOS */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mis proyectos</h2>
          <button
            onClick={() => nav("/prof/proyectos/nuevo")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Nuevo Proyecto
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {proyectos.map(p => {
            const isActivo = String(p.estado).toLowerCase() === "activo";

            return (
              <article key={p.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-200 transition-colors group">
                <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{p.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.objetivo}</p>
                    {p.tecnologias && (
                      <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-200 inline-block px-2 py-1 rounded">
                        {p.tecnologias}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isActivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                    </span>
                    <button
                      onClick={() => toggleEstado(p.id)}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${isActivo ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isActivo ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>

                <div className="px-4 py-4 bg-white">
                  <p className="text-gray-700 line-clamp-3 text-sm">{p.descripcion}</p>
                  <div className="mt-4 flex gap-3 pt-4 border-t border-gray-50">
                    <button onClick={() => nav(`/prof/proyectos/${p.id}/editar`)} className="px-4 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors font-medium">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="px-4 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors font-medium">
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {proyectos.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">Aún no tienes proyectos creados.</p>
              <button onClick={() => nav("/prof/proyectos/nuevo")} className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm">
                Crear mi primer proyecto
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}