import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/mystoryknight/",
  build: {
    rollupOptions: {
      output: {
        // Split the big vendor libraries out of the app chunk so the initial
        // bundle stays under Vite's 500 kB warning and vendors cache separately.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          mantine: ["@mantine/core", "@mantine/hooks"],
        },
      },
    },
  },
  server: {
    port: 3000, // Default port
    strictPort: true, // Don't allow a different port than the one specified
    host: true, // Allow external access to the server
    watch: {
      // Filesystem events do not cross a Docker bind mount on Windows/macOS, so
      // without polling Vite never invalidates its cache and serves stale modules.
      usePolling: true,
      interval: 300,
    },
  },
});
