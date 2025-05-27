import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/sign-validator/',
  plugins: [react()],
  server: {
    port: 3000,
  },
});
