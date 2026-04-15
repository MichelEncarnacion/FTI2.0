import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { supabase } from '../../../lib/supabase';
import {
  Plus, Pencil, Eye, EyeOff, X, Loader2,
  Bold, Italic, Link as LinkIcon, Image as ImageIcon,
  List, ListOrdered
} from 'lucide-react';

// ── Strip HTML tags for list preview ─────────────────────────────────────────
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

// ── Trash icon (inline SVG, matches pattern in Dashboard.jsx) ────────────────
function TrashIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({ children, active, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

// ── TipTap Toolbar ────────────────────────────────────────────────────────────
function Toolbar({ editor, onImageUpload }) {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 bg-slate-50 rounded-t-xl">
      <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
        <Bold size={14} />
      </ToolBtn>
      <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
        <Italic size={14} />
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Título H2"
      >
        <span className="text-xs font-black">H2</span>
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Título H3"
      >
        <span className="text-xs font-black">H3</span>
      </ToolBtn>
      <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
        <List size={14} />
      </ToolBtn>
      <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        <ListOrdered size={14} />
      </ToolBtn>
      <ToolBtn active={editor.isActive('link')} onClick={setLink} title="Insertar enlace">
        <LinkIcon size={14} />
      </ToolBtn>
      <ToolBtn onClick={onImageUpload} title="Insertar imagen">
        <ImageIcon size={14} />
      </ToolBtn>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnunciosAdmin() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [form, setForm] = useState({ titulo: '', link_externo: '', visible: true });

  const imageInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: '',
    editorProps: {
      attributes: { class: 'tiptap-editor' },
    },
  });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('anuncios')
      .select('*')
      .order('creado_at', { ascending: false });
    setAnuncios(data || []);
    setLoading(false);
  };

  const abrirCrear = () => {
    setEditId(null);
    setForm({ titulo: '', link_externo: '', visible: true });
    setCoverFile(null);
    editor?.commands.clearContent();
    setModalOpen(true);
  };

  const abrirEditar = (a) => {
    setEditId(a.id);
    setForm({ titulo: a.titulo, link_externo: a.link_externo || '', visible: a.visible });
    setCoverFile(null);
    editor?.commands.setContent(a.contenido || '');
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditId(null);
    setCoverFile(null);
    editor?.commands.clearContent();
  };

  // Upload image from TipTap toolbar → inserts into editor body
  const handleInlineImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const ext = file.name.split('.').pop();
    const path = `inline/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('anuncios').upload(path, file);
    if (error) { alert('Error subiendo imagen: ' + error.message); return; }
    const { data } = supabase.storage.from('anuncios').getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
    e.target.value = '';
  }, [editor]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const contenido = editor?.getHTML() || '';
      let imagen_path = editId ? (anuncios.find(a => a.id === editId)?.imagen_path ?? null) : null;

      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `covers/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('anuncios').upload(path, coverFile);
        if (upErr) throw upErr;
        imagen_path = path;
      }

      const payload = {
        titulo: form.titulo,
        contenido,
        imagen_path,
        link_externo: form.link_externo || null,
        visible: form.visible,
      };

      if (editId) {
        const { error } = await supabase.from('anuncios').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('anuncios').insert([payload]);
        if (error) throw error;
      }

      cerrarModal();
      cargar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (a) => {
    if (!window.confirm('¿Eliminar este anuncio?')) return;
    if (a.imagen_path) await supabase.storage.from('anuncios').remove([a.imagen_path]);
    await supabase.from('anuncios').delete().eq('id', a.id);
    cargar();
  };

  const toggleVisible = async (a) => {
    await supabase.from('anuncios').update({ visible: !a.visible }).eq('id', a.id);
    cargar();
  };

  const anuncioUrl = (path) =>
    supabase.storage.from('anuncios').getPublicUrl(path).data.publicUrl;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-rose-500" size={28} />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-12 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg font-bold text-slate-800">📢 Anuncios</h3>
        <button
          onClick={abrirCrear}
          className="w-full sm:w-auto bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-100 hover:bg-rose-700 transition-colors"
        >
          <Plus size={18} /> Nuevo Anuncio
        </button>
      </div>

      {/* List */}
      {anuncios.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-10">Sin anuncios publicados.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {anuncios.map(a => (
            <div key={a.id} className="flex items-center gap-4 py-4">
              {a.imagen_path && (
                <img
                  src={anuncioUrl(a.imagen_path)}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  alt=""
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{a.titulo}</p>
                <p className="text-xs text-slate-400">
                  {new Date(a.creado_at).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {stripHtml(a.contenido).slice(0, 100)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleVisible(a)}
                  title={a.visible ? 'Ocultar' : 'Publicar'}
                  className={`p-2 rounded-full ${a.visible ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
                >
                  {a.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => abrirEditar(a)}
                  className="p-2 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleEliminar(a)}
                  className="p-2 rounded-full text-rose-500 bg-rose-50 hover:bg-rose-100"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">
                {editId ? 'Editar Anuncio' : 'Nuevo Anuncio'}
              </h2>
              <button onClick={cerrarModal} className="p-2 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-5">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Título *
                </label>
                <input
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  required
                />
              </div>

              {/* Cover image */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Imagen de portada (opcional)
                </label>
                <label className="flex items-center gap-3 w-full h-16 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 px-4 transition-colors">
                  <ImageIcon size={16} className="text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-400 truncate">
                    {coverFile ? coverFile.name : 'Subir imagen de portada'}
                  </span>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setCoverFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* TipTap editor */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Contenido *
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden tiptap-editor">
                  <Toolbar editor={editor} onImageUpload={() => imageInputRef.current?.click()} />
                  <EditorContent editor={editor} />
                </div>
                {/* Hidden input for inline image upload */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleInlineImageUpload}
                />
              </div>

              {/* External link */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Link externo (opcional)
                </label>
                <input
                  type="url"
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  placeholder="https://..."
                  value={form.link_externo}
                  onChange={e => setForm({ ...form, link_externo: e.target.value })}
                />
              </div>

              {/* Visible toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.visible ? 'bg-rose-600' : 'bg-slate-200'}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.visible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {form.visible ? 'Visible en Home' : 'Oculto'}
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.visible}
                  onChange={e => setForm({ ...form, visible: e.target.checked })}
                />
              </label>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-rose-100 transition-colors"
                >
                  {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Guardar Anuncio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
