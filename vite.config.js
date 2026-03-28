import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      include: /\.[tj]sx?$/,
      babel: {
        presets: [["@babel/preset-react", { runtime: "automatic" }]],
      },
    }),
    laravel({
      input: ["resources/js/main.jsx", "resources/css/app.css"],
      refresh: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "resources/js"),
    },
  },
});
