// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

// Estático salvo /api/sugerencia (prerender = false, función de Vercel).
// React solo lo usa la isla del panel (/admin): las páginas sin islas React,
// como /, no cargan nada de React.
// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  integrations: [react()],
});
