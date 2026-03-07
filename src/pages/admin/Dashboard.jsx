// src/pages/Admin/UsuariosDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import GaleriaAdmin from './components/GaleriaAdmin';
import { LogOut, UserPlus, Users, Shield, EyeOff, GraduationCap, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function UsuariosDashboard() {
  // Ahora tenemos dos estados separados, uno para cada tabla
  const [perfiles, setPerfiles] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' o 'estudiantes'
  const [file, setFile] = useState(null); // Para la foto del estudiante

  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '', email: '', password: '', rol: 'profesor',
    formacion_lic: '', formacion_mtr: '', formacion_doc: '', visible: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    // 1. Cargar Profesores/Admins de la tabla 'perfiles'
    const { data: dataPerfiles } = await supabase
      .from('perfiles')
      .select('*')
      .order('nombre');
    setPerfiles(dataPerfiles || []);

    // 2. Cargar Estudiantes de la nueva tabla 'estudiantes_destacados'
    const { data: dataEstudiantes } = await supabase
      .from('estudiantes_destacados')
      .select('*')
      .order('creado_at', { ascending: false });
    setEstudiantes(dataEstudiantes || []);

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // LÓGICA PARA ESTUDIANTES (Nueva Tabla)
      if (activeTab === 'estudiantes' && !editId) {
        let fotoPath = null;
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `estudiantes/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
          if (uploadError) throw uploadError;
          fotoPath = filePath;
        }

        const { error: insErr } = await supabase.from('estudiantes_destacados').insert([{
          nombre: form.nombre,
          formacion_lic: form.formacion_lic,
          foto_storage_path: fotoPath,
          visible: true
        }]);
        if (insErr) throw insErr;
      }
      // LÓGICA PARA PROFESORES / ADMINS (Existente - Tabla perfiles)
      else {
        if (editId) {
          const { error: updErr } = await supabase.from('perfiles').update({
            nombre: form.nombre, rol: form.rol,
            formacion_lic: form.formacion_lic, formacion_mtr: form.formacion_mtr,
            formacion_doc: form.formacion_doc, visible: form.visible
          }).eq('id', editId);
          if (updErr) throw updErr;
        } else {
          const { data, error: fErr } = await supabase.functions.invoke('create-user', { body: form });
          if (fErr || data?.error) throw new Error(fErr?.message || data?.error);
        }
      }

      setMensaje('Operación exitosa');
      setModalOpen(false);
      setFile(null);
      cargarDatos(); // Recargamos ambos estados
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, isEstudiante) => {
    if (!window.confirm('¿Eliminar totalmente este registro?')) return;
    try {
      if (isEstudiante) {
        // Borrar de la nueva tabla
        const { error } = await supabase.from('estudiantes_destacados').delete().eq('id', id);
        if (error) throw error;
      } else {
        // Lógica existente para perfiles (usa Edge Function si es necesario borrar de Auth)
        const { error } = await supabase.functions.invoke('delete-user', { body: { userId: id } });
        if (error) throw error;
      }
      cargarDatos();
    } catch (err) { alert(err.message); }
  };

  const toggleVisibilidad = async (id, actual) => {
    await supabase.from('perfiles').update({ visible: !actual }).eq('id', id);
    cargarDatos();
  };

  const stats = {
    admins: perfiles.filter(p => p.rol === 'administrador').length,
    profesores: perfiles.filter(p => p.rol === 'profesor').length,
    estudiantes: estudiantes.length // Ahora sacamos la cuenta del array de estudiantes
  };

  // Helper para URL de imagen (reutilizado del otro componente)
  const getImageUrl = (path) => {
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white"><Shield size={20} /></div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin<span className="text-indigo-600">Panel</span></h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors">
            <LogOut size={18} /><span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard label="Admins" val={stats.admins} color="text-indigo-600" icon={Shield} />
          <StatCard label="Profesores" val={stats.profesores} color="text-emerald-600" icon={Users} />
          <StatCard label="Estudiantes" val={stats.estudiantes} color="text-blue-600" icon={GraduationCap} />
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('personal')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Personal Académico
          </button>
          <button onClick={() => setActiveTab('estudiantes')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'estudiantes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Galería Estudiantes
          </button>
        </div>

        {activeTab === 'personal' ? (
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-12">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-indigo-500" /> Gestión Académica</h3>
              <button onClick={() => { setForm({ nombre: '', email: '', password: '', rol: 'profesor', formacion_lic: '', formacion_mtr: '', formacion_doc: '', visible: true }); setEditId(null); setModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100">
                <UserPlus size={18} /> Nuevo Académico
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-50">
                  {perfiles.map(p => (
                    <UserRow key={p.id} p={p} onEdit={() => { setForm(p); setEditId(p.id); setModalOpen(true); }} onDelete={() => handleDelete(p.id, false)} onToggle={() => toggleVisibilidad(p.id, p.visible)} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-12 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><GraduationCap size={20} className="text-blue-500" /> Galería de Estudiantes</h3>
              <button onClick={() => { setForm({ nombre: '', formacion_lic: '', visible: true }); setEditId(null); setModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-100">
                <UserPlus size={18} /> Agregar Estudiante
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {estudiantes.map(est => (
                <div key={est.id} className="group relative bg-slate-50 rounded-3xl p-4 text-center border border-transparent hover:border-blue-200 hover:bg-white transition-all">
                  <button onClick={() => handleDelete(est.id, true)} className="absolute top-2 right-2 p-2 bg-white text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><Trash2 size={14} /></button>
                  <div className="w-24 h-24 mx-auto bg-slate-200 rounded-full mb-3 overflow-hidden border-4 border-white shadow-sm">
                    {est.foto_storage_path ? (
                      <img src={getImageUrl(est.foto_storage_path)} className="w-full h-full object-cover" />
                    ) : (<div className="flex items-center justify-center h-full text-slate-400 text-[10px] font-black uppercase">S/F</div>)}
                  </div>
                  <p className="font-bold text-slate-900 text-sm line-clamp-1">{est.nombre}</p>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{est.formacion_lic}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN GALERÍA PROYECTOS */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-2 sm:p-6 overflow-hidden">
          <GaleriaAdmin />
        </div>

        {/* MODAL MULTIUSO */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
              <form onSubmit={handleGuardarUsuario} >
                <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">
                  {activeTab === 'estudiantes' ? 'Nuevo Estudiante' : (editId ? 'Editar Perfil' : 'Crear Usuario')}
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                      <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                    </div>

                    {activeTab !== 'estudiantes' && (
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Acceso</label>
                        <input type="email" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                      </div>
                    )}

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{activeTab === 'estudiantes' ? 'Licenciatura' : 'Rol Sistema'}</label>
                      {activeTab === 'estudiantes' ? (
                        <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Ej. Arquitectura" value={form.formacion_lic} onChange={e => setForm({ ...form, formacion_lic: e.target.value })} required />
                      ) : (
                        <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold text-slate-700" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                          <option value="profesor">Profesor</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      )}
                    </div>

                    {activeTab === 'estudiantes' && (
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-blue-500">Foto de Perfil</label>
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="flex flex-center gap-2 text-slate-400">
                            <ImageIcon size={18} />
                            <span className="text-xs font-bold">{file ? file.name : "Subir Imagen"}</span>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => { setModalOpen(false); setFile(null); }} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
                  <button type="submit" className={`flex-[2] text-white py-4 rounded-2xl font-bold transition-all shadow-xl ${activeTab === 'estudiantes' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin mx-auto" /> : 'Guardar Datos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// COMPONENTES AUXILIARES PARA LIMPIEZA
function UserRow({ p, onEdit, onDelete, onToggle }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-8 py-5">
        <p className="font-bold text-slate-900">{p.nombre}</p>
        <p className="text-xs text-slate-400 font-medium">{p.email}</p>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.rol === 'administrador' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{p.rol}</span>
          <button onClick={onToggle} className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${p.visible ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{p.visible ? 'Visible' : 'Oculto'}</button>
        </div>
      </td>
      <td className="px-8 py-5 text-right space-x-4">
        <button onClick={onEdit} className="text-indigo-600 font-bold text-xs uppercase">Editar</button>
        <button onClick={onDelete} className="text-rose-500 font-bold text-xs uppercase">Borrar</button>
      </td>
    </tr>
  );
}

function StatCard({ label, val, color, icon: Icon }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
      <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}><Icon size={24} /></div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-3xl font-black ${color}`}>{val}</p>
      </div>
    </div>
  );
}

// Icono faltante
function Trash2({ size }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>; }