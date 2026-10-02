import { expect, test } from "@playwright/test";

/** Text of the file block with the given title. */
const block = (page: import("@playwright/test").Page, title: string) =>
  page.locator(".code").filter({ has: page.getByText(title, { exact: true }) });

const file = (page: import("@playwright/test").Page, title: string) =>
  block(page, title).locator("pre");

test("config constructor: Cloudflare config with the secret kept out", async ({
  page,
}) => {
  await page.goto("#/config");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Настройка dnspatch",
  );

  await page
    .getByLabel("ID зоны (Zone ID)")
    .fill("023e105f4ecef8ad9ca31a8372d0c353");
  await page.getByLabel("Домен", { exact: true }).fill("example.com");
  await page.getByLabel("Имя записи").fill("home");

  const toml = file(page, "dnspatch.toml");
  await expect(toml).toContainText('zone = "example.com"');
  await expect(toml).toContainText('token = "${CLOUDFLARE_TOKEN}"');
  await expect(file(page, ".env")).toContainText("CLOUDFLARE_TOKEN=");
  await expect(page.locator(".warn")).toHaveCount(0);
});

test("config constructor: warns about empty required fields", async ({
  page,
}) => {
  await page.goto("#/config");
  await expect(page.locator(".warn")).toContainText("Заполните");
});

test("config constructor: a key that lives in a file is mounted into the container", async ({
  page,
}) => {
  await page.goto("#/config");
  await page.getByText("Yandex Cloud DNS").click();
  await expect(file(page, "dnspatch.toml")).toContainText(
    "${file:/etc/dnspatch/secrets/yandexcloud_key}",
  );
  await expect(file(page, "compose.yml")).toContainText(
    "./secrets:/etc/dnspatch/secrets:ro",
  );
  // No environment variable is needed, so no .env file is offered.
  await expect(block(page, ".env")).toHaveCount(0);
  await expect(file(page, "dnspatch.toml")).not.toContainText(".env");
});

test("language switch", async ({ page }) => {
  await page.goto("#/config");
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Set up dnspatch",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("build helper: ping_url points to the full image", async ({ page }) => {
  await page.goto("#/build");
  await page.getByLabel("Ваш dnspatch.toml").fill(
    `[[instance]]
name = "a"
ping_url = "\${PING}"
[[instance.retriever]]
type = "ipify"
[[instance.provider]]
type = "cloudflare"
`,
  );
  await expect(page.getByText("Нужен вариант «full»")).toBeVisible();
  await expect(page.locator("pre").first()).toHaveText(
    "docker pull krimsn/dnspatch:latest-full",
  );
});

test("build helper: default plugins need no build", async ({ page }) => {
  await page.goto("#/build");
  await page.getByLabel("Cloudflare").check();
  await expect(page.getByText("Своя сборка не нужна")).toBeVisible();
});

test("build helper: a broken config is reported, not thrown", async ({
  page,
}) => {
  await page.goto("#/build");
  await page.getByLabel("Ваш dnspatch.toml").fill("not = = toml");
  await expect(page.locator(".warn")).toContainText("Не удалось прочитать");
});

for (const route of ["#/config", "#/build"]) {
  test(`phone width: no horizontal scroll on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("the page loads nothing from other origins", async ({ page }) => {
  const foreign: string[] = [];
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (
      url.origin !== "http://localhost:4173" &&
      url.protocol.startsWith("http")
    )
      foreign.push(r.url());
  });
  await page.goto("#/config");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(foreign).toEqual([]);
});
