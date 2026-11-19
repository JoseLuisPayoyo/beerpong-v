// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Estático salvo /api/sugerencia (prerender = false, función de Vercel).
// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
});
