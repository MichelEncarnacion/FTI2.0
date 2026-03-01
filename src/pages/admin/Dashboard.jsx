// src/pages/Admin/UsuariosDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import GaleriaAdmin from './components/GaleriaAdmin';
import { LogOut, UserPlus, Users, Shield, EyeOff, LayoutDashboard } from 'lucide-react';

export default function UsuariosDashboard() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [editId, setEditId] = useState(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '', email: '', password: '', rol: 'profesor',
    formacion_lic: '', formacion_mtr: '', formacion_doc: '', visible: true
  });

  useEffect(() => {
    cargarPerfiles();
  }, []);

  const cargarPerfiles = async () => {
    setLoading(true);
    const { data } = await supabase.from('perfiles').select('*').order('nombre');
    setPerfiles(data || []);
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
      setMensaje('Operación exitosa');
      setModalOpen(false);
      cargarPerfiles();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Eliminar totalmente este usuario?')) return;
    try {
      const { error } = await supabase.functions.invoke('delete-user', { body: { userId: id } });
      if (error) throw error;
      cargarPerfiles();
    } catch (err) { alert(err.message); }
  };

  const toggleVisibilidad = async (id, actual) => {
    await supabase.from('perfiles').update({ visible: !actual }).eq('id', id);
    cargarPerfiles();
  };

  if (loading && perfiles.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 font-bold tracking-widest">
        CARGANDO PANEL...
      </div>
    );
  }

  const stats = {
    admins: perfiles.filter(p => p.rol === 'administrador').length,
    profesores: perfiles.filter(p => p.rol === 'profesor').length,
    ocultos: perfiles.filter(p => !p.visible).length
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* NAVBAR SUPERIOR */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Shield size={20} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin<span className="text-indigo-600">Panel</span></h1>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* ENCABEZADO Y STATS */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard General</h2>
              <p className="text-slate-500 font-medium">Gestiona el personal académico y la galería institucional.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Administradores" val={stats.admins} color="text-indigo-600" icon={Shield} />
            <StatCard label="Profesores" val={stats.profesores} color="text-emerald-600" icon={Users} />
            <StatCard label="Perfiles Ocultos" val={stats.ocultos} color="text-amber-600" icon={EyeOff} />
          </div>
        </div>

        {mensaje && (
          <div className="bg-emerald-500 text-white p-4 rounded-2xl mb-6 shadow-lg shadow-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
            <span className="font-bold">✓ {mensaje}</span>
          </div>
        )}

        {/* SECCIÓN USUARIOS */}
        <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" />
              Gestión de Usuarios
            </h3>
            <button
              onClick={() => {
                setForm({ nombre: '', email: '', password: '', rol: 'profesor', formacion_lic: '', formacion_mtr: '', formacion_doc: '', visible: true });
                setEditId(null);
                setModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              <UserPlus size={18} />
              Nuevo Usuario
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-8 py-4">Usuario</th>
                  <th className="px-8 py-4">Rol / Estado</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {perfiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900">{p.nombre}</p>
                      <p className="text-xs text-slate-400 font-medium">{p.email}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.rol === 'administrador' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.rol}
                        </span>
                        <button
                          onClick={() => toggleVisibilidad(p.id, p.visible)}
                          className={`text-[10px] uppercase font-black px-3 py-1 rounded-full transition-colors ${p.visible ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                        >
                          {p.visible ? 'Visible' : 'Oculto'}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right space-x-4">
                      <button onClick={() => { setForm(p); setEditId(p.id); setModalOpen(true); }} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase transition-colors">Editar</button>
                      <button onClick={() => handleDeleteUser(p.id)} className="text-rose-500 hover:text-rose-700 font-bold text-xs uppercase transition-colors">Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECCIÓN GALERÍA */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-2 sm:p-6 overflow-hidden">
          <GaleriaAdmin />
        </div>

        {/* MODAL USUARIO */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <form onSubmit={handleGuardarUsuario} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
              <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">{editId ? 'Editar Perfil' : 'Crear Usuario'}</h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                {!editId && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                    <input type="password" placeholder="Mínimo 6 caracteres" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                  <select className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                    <option value="profesor">Profesor</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                {form.rol === 'profesor' && (
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-3">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Grados Académicos</p>
                    <input placeholder="Licenciatura" className="bg-slate-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={form.formacion_lic} onChange={e => setForm({ ...form, formacion_lic: e.target.value })} />
                    <input placeholder="Maestría" className="bg-slate-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={form.formacion_mtr} onChange={e => setForm({ ...form, formacion_mtr: e.target.value })} />
                    <input placeholder="Doctorado" className="bg-slate-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={form.formacion_doc} onChange={e => setForm({ ...form, formacion_doc: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
                <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Datos'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, val, color, icon: Icon }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
      <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={`text-3xl font-black ${color}`}>{val}</p>
      </div>
    </div>
  );
}