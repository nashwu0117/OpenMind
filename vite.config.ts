import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], base: './', server: { port: 5187, strictPort: true }, test: { include: ['tests/**/*.test.ts'] } });
