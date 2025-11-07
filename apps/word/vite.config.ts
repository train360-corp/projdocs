import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import mkcert from "vite-plugin-mkcert";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";



export default defineConfig({
  plugins: [
    mkcert(),
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        // { src: "manifest.xml", dest: "" },
        { src: "public/icons/**/*", dest: "icons" },
      ],
    }),
  ],
  root: __dirname,
  publicDir: path.resolve(__dirname, "public"),
  base: "./",
  resolve: {
    alias: {
      "@workspace/word": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        ribbon: path.resolve(__dirname, "src/surfaces/ribbon/index.html"),
        filePicker: path.resolve(__dirname, "src/surfaces/folder-picker/index.html"),
        dialog: path.resolve(__dirname, "src/surfaces/dialog/index.html"),
      }
    }
  },
  server: {
    port: 8000,
    strictPort: true
  },
});