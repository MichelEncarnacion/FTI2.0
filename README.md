# UPAEP FTI — Plataforma Web SAPS

Plataforma de gestión de proyectos académicos para la Facultad de Tecnología e Ingeniería (FTI) de la UPAEP, organizada en torno al programa **SAPS** (Servicio, Aprendizaje, Profesionalización y Social).

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite |
| Estilos | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Funciones privilegiadas | Supabase Edge Functions (Deno) |
| Formularios | React Hook Form + Yup |
| Editor de texto | TipTap |
| Subida de archivos | React Dropzone + Supabase Storage |

---

## Categorías SAPS

Los proyectos se clasifican en cuatro áreas:

- **Trabajo y Competitividad** — `/saps/trabajo-competitividad`
- **Vida y Salud** — `/saps/vida-salud`
- **STEM** — `/saps/stem`
- **Desarrollo Humano** — `/saps/desarrollo-humano`

---

## Roles y Acceso

| Rol | Acceso | Ruta |
|-----|--------|------|
| Público | Portada, categorías SAPS, detalle de proyecto | `/`, `/saps/*`, `/proyecto/:id` |
| Profesor | Dashboard propio, CRUD de proyectos | `/prof/*` |
| Administrador | Panel completo de gestión | `/admin` |

Los guards `RequireAuth` y `PublicRoute` en `src/components/` protegen todas las rutas privadas.

---

## Estructura del Proyecto

```
src/
├── auth/            # Login
├── components/      # Navbar, guards, componentes reutilizables
├── context/         # AuthContext — estado de sesión y rol
├── lib/             # Cliente Supabase
├── pages/
│   ├── Home.jsx
│   ├── ProyectoDetail.jsx
│   ├── Saps*.jsx    # Páginas por categoría
│   ├── prof/        # Dashboard y formularios de profesor
│   └── admin/       # Dashboard admin + módulos (galería, colaboradores, etc.)
supabase/
└── functions/
    ├── create-user/ # Crea usuario en Auth + perfiles (solo admin)
    └── delete-user/ # Elimina usuario en Auth + perfiles (solo admin)
```

---

## Variables de Entorno

Crea un archivo `.env` en la raíz con:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

---

## Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:5173)
npm run dev

# Build de producción → dist/
npm run build

# Previsualizar build
npm run preview

# Lint
npm run lint
```

### Supabase local

```bash
supabase start   # API en :54321, DB en :54322
supabase stop
```

---

## Base de Datos (tablas principales)

| Tabla | Descripción |
|-------|-------------|
| `perfiles` | Usuarios con campo `rol` (profesor / administrador) |
| `proyectos` | Proyectos académicos con categoría SAPS |
| `estudiantes_destacados` | Talento estudiantil destacado |
| `colaboradores` | Empresas/instituciones aliadas |
| `galeria` | Imágenes de la galería institucional |

**Storage buckets:** `avatars` (imágenes de estudiantes y proyectos), `colaboradores` (logos de aliados).

---

## Panel de Administración

El dashboard `/admin` centraliza la gestión completa en pestañas:

- **Proyectos** — aprobar / editar / eliminar proyectos de todos los profesores
- **Usuarios** — crear y eliminar cuentas de profesores vía Edge Functions
- **Galería** — subir y gestionar imágenes institucionales
- **Colaboradores** — logos y datos de aliados estratégicos
- **Estudiantes Destacados** — talento estudiantil con ficha y foto
- **Anuncios** — publicar avisos con editor de texto enriquecido

---

## Licencia

Proyecto académico — UPAEP FTI. Todos los derechos reservados.
