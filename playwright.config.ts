import { defineConfig } from "@playwright/test";

// Tests run against the production build, with the strict CSP of the real site.
// They use an installed browser (PW_CHANNEL, Chrome by default), so no browser
// has to be downloaded.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173/builder/",
    channel: process.env.PW_CHANNEL ?? "chrome",
    locale: "ru-RU",
  },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173/builder/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
