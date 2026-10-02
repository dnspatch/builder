import preact from "@preact/preset-vite";
import { defineConfig, type Plugin } from "vite";

// The dev server injects styles with <style> tags and talks to the browser over
// a WebSocket, both of which the strict policy in index.html forbids. The
// production build keeps the strict policy.
const relaxCspInDev: Plugin = {
  name: "relax-csp-in-dev",
  apply: "serve",
  transformIndexHtml: (html) =>
    html
      .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
      .replace("connect-src 'self'", "connect-src 'self' ws:"),
};

// The site is a GitHub Pages project site, served under /builder/.
export default defineConfig({
  base: "/builder/",
  plugins: [preact(), relaxCspInDev],
  build: { target: "es2022", sourcemap: true },
});
