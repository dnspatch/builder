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
  await expect(page.locator(".step-warn")).toHaveCount(0);
});

test("domain block: the warning names the empty fields, folded or not", async ({
  page,
}) => {
  await page.goto("#/config");
  const step = page.locator(".step", { hasText: "Где находится ваш домен" });
  const warn = step.locator(":scope > summary .step-warn");

  // Named as the form names them, not by their keys in the file.
  await expect(warn).toHaveText(
    "Заполните: ID зоны (Zone ID), Домен, Имя записи",
  );
  await expect(step).toHaveAttribute("open", "");

  await step.locator(":scope > summary").click();
  await expect(step).not.toHaveAttribute("open", "");
  await expect(warn).toBeVisible();

  await step.locator(":scope > summary").click();
  await page.getByLabel("Домен", { exact: true }).fill("example.com");
  await expect(warn).toHaveText("Заполните: ID зоны (Zone ID), Имя записи");

  // The result panel no longer carries the warning.
  await expect(page.locator(".result .warn")).toHaveCount(0);
});

test("every block can be folded and opened", async ({ page }) => {
  await page.goto("#/config");
  const steps = page.locator(".step");
  await expect(steps).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    const step = steps.nth(i);
    const wasOpen = await step.evaluate(
      (el) => (el as HTMLDetailsElement).open,
    );
    await step.locator(":scope > summary").click();
    await expect(step).toHaveJSProperty("open", !wasOpen);
    await step.locator(":scope > summary").click();
    await expect(step).toHaveJSProperty("open", wasOpen);
  }
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

test("retrievers: three popular services by default, in order", async ({
  page,
}) => {
  await page.goto("#/config");
  const items = page.locator(".chain li");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText("ipify");
  await expect(items.nth(1)).toContainText("icanhazip");
  await expect(items.nth(2)).toContainText("ifconfig.co");

  const toml = (await file(page, "dnspatch.toml").textContent()) ?? "";
  const at = (type: string) => toml.indexOf(`type = "${type}"`);
  expect(at("ipify")).toBeGreaterThan(-1);
  expect(at("ipify")).toBeLessThan(at("icanhazip"));
  expect(at("icanhazip")).toBeLessThan(at("ifconfigco"));
});

test("retrievers: a backup can be added, reordered with arrows and removed", async ({
  page,
}) => {
  await page.goto("#/config");
  const toml = file(page, "dnspatch.toml");
  const items = page.locator(".chain li");

  await page.getByRole("button", { name: "Убрать: ifconfig.co" }).click();
  await page.getByRole("button", { name: "Убрать: icanhazip" }).click();
  await expect(items).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Убрать/ })).toBeDisabled();

  await page
    .getByLabel("Добавить запасной", { exact: true })
    .selectOption("icanhazip");
  await page.getByRole("button", { name: "Добавить запасной" }).click();
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText("Основной");
  await expect(items.nth(1)).toContainText("Запасной 1");

  await page.getByRole("button", { name: "Выше: icanhazip" }).click();
  await expect(items.nth(0)).toContainText("icanhazip");
  const swapped = (await toml.textContent()) ?? "";
  expect(swapped.indexOf('type = "icanhazip"')).toBeLessThan(
    swapped.indexOf('type = "ipify"'),
  );

  await page.getByRole("button", { name: "Убрать: icanhazip" }).click();
  await expect(items).toHaveCount(1);
  await expect(toml).not.toContainText("icanhazip");
});

test("retrievers: a row can be dragged to a new place", async ({ page }) => {
  await page.goto("#/config");
  const items = page.locator(".chain li");

  // The last one, ifconfig.co, goes to the top and becomes the main one.
  await items.nth(2).dragTo(items.nth(0));
  await expect(items.nth(0)).toContainText("ifconfig.co");
  await expect(items.nth(0)).toContainText("Основной");
  await expect(items.nth(1)).toContainText("ipify");
  await expect(items.nth(2)).toContainText("icanhazip");

  const toml = (await file(page, "dnspatch.toml").textContent()) ?? "";
  expect(toml.indexOf('type = "ifconfigco"')).toBeLessThan(
    toml.indexOf('type = "ipify"'),
  );

  // Dropping a row on itself changes nothing.
  await items.nth(1).dragTo(items.nth(1));
  await expect(items.nth(1)).toContainText("ipify");
});

test("notifications: off by default, on they switch to the full image", async ({
  page,
}) => {
  await page.goto("#/config");
  const compose = file(page, "compose.yml");
  await expect(compose).toContainText("krimsn/dnspatch:latest\n");
  await expect(file(page, "dnspatch.toml")).not.toContainText("notify");

  await page.getByText("Уведомления (необязательно)").click();
  await expect(
    page.getByText("сам ничего не отправляет в Telegram"),
  ).toBeVisible();
  await page.getByLabel("Отправлять события в MQTT").check();

  const toml = file(page, "dnspatch.toml");
  await expect(toml).toContainText("[[instance.notify]]");
  await expect(toml).toContainText('type = "mqtt"');
  await expect(toml).toContainText('address = "${MQTT_ADDRESS}"');
  await expect(file(page, ".env")).toContainText("MQTT_ADDRESS=");
  await expect(compose).toContainText("krimsn/dnspatch:latest-full");

  // status alone is the default and is not written; more events are.
  await expect(toml).not.toContainText("events");
  await page.getByLabel("Смена адреса").check();
  await expect(toml).toContainText('events = ["status", "ip_change"]');

  await page.getByLabel("Отправлять события в MQTT").uncheck();
  await expect(toml).not.toContainText("notify");
  // The block stays open, so another notifier can be picked straight away.
  await expect(page.getByLabel("Отправлять события в RabbitMQ")).toBeVisible();
  await page.getByLabel("Отправлять события в RabbitMQ").check();
  await expect(toml).toContainText('type = "rabbitmq"');
  await page.getByLabel("Отправлять события в RabbitMQ").uncheck();
  await expect(page.getByLabel("Отправлять события в Redis")).toBeVisible();
  await expect(compose).toContainText("krimsn/dnspatch:latest\n");
});

test("monitoring: ping_url comes from the environment and needs the full image", async ({
  page,
}) => {
  await page.goto("#/config");
  const toml = file(page, "dnspatch.toml");
  const compose = file(page, "compose.yml");
  await expect(toml).not.toContainText("ping_url");

  await page.getByText("Мониторинг (необязательно)").click();
  await page.getByLabel("Сообщать о работе по ссылке (ping)").check();

  await expect(toml).toContainText('ping_url = "${PING_URL}"');
  await expect(file(page, ".env")).toContainText("PING_URL=");
  await expect(compose).toContainText("krimsn/dnspatch:latest-full");

  // The same instance table, not a table of its own.
  const text = (await toml.textContent()) ?? "";
  expect(text.indexOf("ping_url")).toBeLessThan(
    text.indexOf("[[instance.retriever]]"),
  );

  await page.getByLabel("Сообщать о работе по ссылке (ping)").uncheck();
  await expect(toml).not.toContainText("ping_url");
  await expect(compose).toContainText("krimsn/dnspatch:latest\n");
});

test("wide screen: the result stays beside the steps", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("#/config");
  const steps = await page.locator(".steps").boundingBox();
  const result = await page.locator(".result").boundingBox();
  expect(steps && result && result.x > steps.x + steps.width - 1).toBe(true);
});

test("narrow screen: the result goes below the steps", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("#/config");
  const steps = await page.locator(".steps").boundingBox();
  const result = await page.locator(".result").boundingBox();
  expect(steps && result && result.y >= steps.y + steps.height - 1).toBe(true);
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
  await expect(
    page.getByText("Вам подойдёт готовый образ krimsn/dnspatch:latest-full"),
  ).toBeVisible();
  await expect(page.locator("pre").first()).toHaveText(
    "docker pull krimsn/dnspatch:latest-full",
  );
});

test("build helper: default plugins need no build", async ({ page }) => {
  await page.goto("#/build");
  await page.getByLabel("Cloudflare").check();
  await expect(
    page.getByText("Вам подойдёт готовый образ krimsn/dnspatch:latest:"),
  ).toBeVisible();
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
