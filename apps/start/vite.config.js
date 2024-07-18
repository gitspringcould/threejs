import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  assetsInclude: ["**/*.hdr", "**/*.jpg", "**/*.glb", "**/*.gltf"],
  server: {
    port: 5173,
  },
});
