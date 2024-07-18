import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  assetsInclude: ["**/*.hdr", "**/*.jpg", "**/*.glb", "**/*.gltf"],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
