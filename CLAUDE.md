# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

No test suite is configured.

For Supabase local development:
```bash
supabase start     # Start local Supabase instance (API on port 54321, DB on 54322)
supabase stop
```

## Architecture Overview

**Stack:** React 19 + Vite + Supabase (PostgreSQL BaaS) + Tailwind CSS

This is an academic project management platform for UPAEP FTI (Faculty of Technology and Engineering), organized around the SAPS program with four category areas.

### Routing & Access Control

Three distinct user tiers with route guards:
- **Public** — Home, SAPS category pages, project detail, login
- **Professor** (`/prof/*`) — Own project CRUD, requires `rol === 'profesor'`
- **Admin** (`/admin/*`) — Full platform management, requires `rol === 'administrador'`

Guards: `RequireAuth` (auth + role check), `PublicRoute` (redirects logged-in users to their dashboard).

### Authentication & Profiles

`AuthContext` (`src/context/AuthContext.jsx`) is the single source of truth. It wraps Supabase Auth and joins the auth user with the `perfiles` table to expose role + profile data. The `perfiles.rol` field drives all access control decisions.

### Database (Supabase)

Direct Supabase client queries from the frontend — no intermediate API layer. Sensitive operations (creating/deleting auth users) go through Supabase Edge Functions in `supabase/functions/`:
- `create-user` — creates Supabase Auth user + inserts into `perfiles` (admin only)
- `delete-user` — deletes auth user + profile (admin only)

Main tables: `perfiles`, `proyectos`, `estudiantes_destacados`, `colaboradores`, `galeria`.

Storage buckets: `avatars` (student/project images), `colaboradores` (partner logos).

### Forms

React Hook Form + Yup for all forms. File uploads use React Dropzone + Supabase Storage.

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.js` | Supabase client (reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| `src/context/AuthContext.jsx` | Auth state + role, wraps entire app |
| `src/App.jsx` | Route definitions and role-based redirects |
| `src/components/RequireAuth.jsx` | Route guard |
| `supabase/functions/` | Deno edge functions for privileged operations |

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
