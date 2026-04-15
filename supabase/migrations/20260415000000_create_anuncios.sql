-- ── Table: anuncios ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.anuncios (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo       TEXT        NOT NULL,
  contenido    TEXT,
  imagen_path  TEXT,
  link_externo TEXT,
  visible      BOOLEAN     DEFAULT true,
  creado_at    TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

-- Public can read visible announcements
CREATE POLICY "anuncios_public_select" ON public.anuncios
  FOR SELECT USING (visible = true);

-- Admins can do everything (insert, update, delete, select all)
CREATE POLICY "anuncios_admin_all" ON public.anuncios
  FOR ALL USING (
    (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'administrador'
  );

-- ── Storage bucket: anuncios (public) ─────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('anuncios', 'anuncios', true)
ON CONFLICT (id) DO NOTHING;

-- Storage: anyone can read
CREATE POLICY "anuncios_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'anuncios');

-- Storage: only admins can upload
CREATE POLICY "anuncios_storage_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'anuncios' AND
    (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'administrador'
  );

-- Storage: only admins can delete
CREATE POLICY "anuncios_storage_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'anuncios' AND
    (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'administrador'
  );
