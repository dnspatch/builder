import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

// The site is a GitHub Pages project site, served under /builder/.
export default defineConfig({
  base: "/builder/",
  plugins: [preact()],
  build: { target: "es2022", sourcemap: true },
});
