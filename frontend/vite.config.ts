import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/MyStoryKnight/",
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
