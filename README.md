# Beerpong V

Página de espera de la V edición del torneo de beer pong de El Pérez y Esos
(Cabra del Santo Cristo): la V hecha con vasos, la fecha y un buzón de sugerencias.

Astro estático + una función de Vercel (`POST /api/sugerencia`) que guarda las
sugerencias en Supabase con la secret key, desde el servidor.

```sh
npm install
cp .env.example .env   # y rellenar
npm run dev
```

| Archivo | Qué es |
| --- | --- |
| `src/lib/v.ts` | Fecha del torneo, `FECHA_CONFIRMADA`, edición y URL del sitio |
| `src/pages/index.astro` | La página |
| `src/components/v/` | La V de vasos y el formulario de sugerencias |
| `src/scripts/v.ts` | La pelota, la tiza y (con fecha) la cuenta atrás |
| `src/pages/api/sugerencia.ts` | Inserta en `sugerencias` (texto 3–1000, honeypot `web`) |
| `src/pages/admin.astro` + `src/admin/` | Panel de admin (isla React, solo en `/admin`) |

Al confirmar la fecha: revisa `FECHA_TORNEO` y pon `FECHA_CONFIRMADA = true` en `src/lib/v.ts`.

## Panel de admin (`/admin`)

Isla React que solo carga `/admin` (noindex). Todo va desde el navegador con la
publishable key y la sesión de Supabase Auth del admin: la seguridad la pone RLS
(`es_admin()`). No usa la secret key ni endpoints de servidor.

- Pestañas: `src/admin/pestanas.ts`. Añadir una = una entrada + su componente.
- Sugerencias: `src/admin/sugerencias/` (lista, filtros, búsqueda, Realtime,
  acciones optimistas con marcha atrás).
