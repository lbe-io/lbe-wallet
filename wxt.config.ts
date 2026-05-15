import react from '@vitejs/plugin-react';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 2048,
    },
  }),
  imports: false,
  manifest: {
    name: 'LBE Wallet',
    version: '1.0.1',
    permissions: ['storage', 'tabs', 'windows', 'alarms'],
    web_accessible_resources: [
      {
        resources: ['inpage.js'],
        matches: ['<all_urls>'],
        // run_at: 'document_start',
      },
    ],
    // content_scripts: [
    //   {
    //     matches: ['https://www.litbee.io/*'],
    //     js: ['login.js'],
    //   },
    // ],
    host_permissions: ['<all_urls>'],
  },
});
