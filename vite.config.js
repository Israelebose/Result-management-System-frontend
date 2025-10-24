import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default ({ mode }) => {
  // Load env vars from .env files
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_API_URL;

  if (!backendUrl || !/^https?:\/\//.test(backendUrl)) {
    throw new Error(`VITE_API_URL is missing or invalid: ${backendUrl}`);
  }

  // Obfuscator plugin setup
  let obfuscatorPlugin;
  try {
    const obfuscator = require('vite-plugin-obfuscator').default;
    obfuscatorPlugin = obfuscator({
      globalOptions: {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: true,
      },
    });
  } catch (error) {
    console.warn(
      'vite-plugin-obfuscator not available, skipping obfuscation:',
      error.message
    );
    obfuscatorPlugin = () => ({ name: 'noop-obfuscator' });
  }

  return defineConfig({
    css: {
    transformer: 'postcss' // force PostCSS, avoid lightningcss
  },
    server: {
      host: '0.0.0.0', // allows access from other devices on LAN
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    plugins: [react(), tailwindcss(), obfuscatorPlugin],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true },
        mangle: true,
        output: { comments: false },
      },
      sourcemap: false,
    },
  });
};
