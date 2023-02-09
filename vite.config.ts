import { defineConfig } from 'vite';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  // @ts-ignore
  plugins: [vercel()],
});