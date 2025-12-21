import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',

  // Exclude /lp folder from Astro processing
  vite: {
    server: {
      fs: {
        allow: ['..']
      }
    }
  },

  // Image optimization
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  }
});
