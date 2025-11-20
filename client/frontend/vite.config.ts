import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { versionPlugin } from './vite-plugins/version-plugin';

// Custom plugin to log errors to terminal
const errorLoggerPlugin = () => {
  return {
    name: 'error-logger',
    configureServer(server) {
      server.ws.on('connection', () => {
        server.ws.on('error', (error) => {
          console.error('\n❌ WebSocket Error:', error);
        });
      });
      
      // Log HMR errors
      server.middlewares.use((err, _req, _res, next) => {
        if (err) {
          console.error('\n❌ Server Error:', err.message);
          console.error(err.stack);
        }
        next(err);
      });
    },
    transform(_code, id) {
      // This will catch transform errors
      return null;
    },
    handleHotUpdate({ file, server }) {
      console.log(`\n🔄 Hot update: ${path.relative(process.cwd(), file)}`);
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    versionPlugin(),
    react({
      // Log React errors to terminal
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy'],
        },
      },
    }),
    errorLoggerPlugin(),
  ],
  resolve: {
    alias: {
      '@framework': path.resolve(__dirname, '../../framework/frontend'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    },
    hmr: {
      overlay: true, // Show error overlay in browser
    },
  },
  // Log errors to terminal
  clearScreen: false, // Don't clear terminal on rebuild
  logLevel: 'info', // Show info, warnings, and errors
  
  // Enhanced error handling
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        console.warn('\n⚠️  Build Warning:', warning.message);
        warn(warning);
      },
    },
  },
});
