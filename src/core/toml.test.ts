import { expect, test } from "vitest";
import type { Schema } from "./schema";
import {
  type ConfigDraft,
  envName,
  generate,
  renderValue,
  usageOf,
} from "./toml";

const schema: Schema = {
  schema_version: 1,
  plugins: [
    {
      kind: "retriever",
      name: "ipify",
      build_tags: ["ipify"],
      fields: [
        {
          name: "family",
          type: "string",
          required: false,
          default: "ipv4",
          description: "",
          secret: false,
        },
      ],
    },
    {
      kind: "provider",
      name: "cloudflare",
      build_tags: ["cloudflare"],
      fields: [
        {
          name: "zone",
          type: "string",
          required: true,
          description: "",
          secret: false,
        },
        {
          name: "ttl",
          type: "integer",
          required: false,
          default: "300",
          description: "",
          secret: false,
        },
        {
          name: "token",
          type: "string",
          required: true,
          description: "",
          secret: true,
        },
      ],
    },
  ],
};

const draft: ConfigDraft = {
  name: "home",
  interval: "5m",
  retrievers: [{ type: "ipify", values: {} }],
  provider: { type: "cloudflare", values: { zone: "example.com", ttl: "120" } },
  notifiers: [],
};

const withMqtt: Schema = {
  ...schema,
  plugins: [
    ...schema.plugins,
    {
      kind: "retriever",
      name: "icanhazip",
      build_tags: ["icanhazip"],
      fields: [],
    },
    {
      kind: "notifier",
      name: "mqtt",
      build_tags: ["mqtt", "notify_all"],
      fields: [
        {
          name: "address",
          type: "string",
          required: true,
          description: "",
          secret: true,
        },
      ],
    },
  ],
};

test("retrievers are written in the order given, the first one being the main", () => {
  const out = generate(
    {
      ...draft,
      retrievers: [
        { type: "icanhazip", values: {} },
        { type: "ipify", values: {} },
      ],
    },
    withMqtt,
  );
  const first = out.toml.indexOf('type = "icanhazip"');
  const second = out.toml.indexOf('type = "ipify"');
  expect(first).toBeGreaterThan(-1);
  expect(first).toBeLessThan(second);
  expect(out.toml.indexOf("[[instance.provider]]")).toBeGreaterThan(second);
});

test("no retriever is reported as missing", () => {
  expect(generate({ ...draft, retrievers: [] }, withMqtt).missing).toEqual([
    "retriever",
  ]);
});

test("a notifier takes its address from the environment and needs the full image", () => {
  const out = generate(
    {
      ...draft,
      notifiers: [{ type: "mqtt", values: {}, events: ["status"] }],
    },
    withMqtt,
  );
  expect(out.toml).toContain("[[instance.notify]]");
  expect(out.toml).toContain('address = "${MQTT_ADDRESS}"');
  expect(out.toml).not.toContain("events");
  expect(out.env).toContain("MQTT_ADDRESS=");
  expect(out.full).toBe(true);
  expect(generate(draft, withMqtt).full).toBe(false);
});

test("events are written in a fixed order, and only when they differ from the default", () => {
  const events = (list: string[]) =>
    generate(
      { ...draft, notifiers: [{ type: "mqtt", values: {}, events: list }] },
      withMqtt,
    ).toml;
  expect(events(["ip_change", "status"])).toContain(
    'events = ["status", "ip_change"]',
  );
  expect(events(["cycle"])).toContain('events = ["cycle"]');
  expect(events([])).not.toContain("events");
});

test("envName upper-cases plugin and field", () => {
  expect(envName("cloudflare", "token")).toBe("CLOUDFLARE_TOKEN");
  expect(envName("2ip", "api-key")).toBe("2IP_API_KEY");
});

test("renderValue checks the type", () => {
  expect(renderValue({ type: "integer" }, "12")).toBe("12");
  expect(renderValue({ type: "integer" }, "x")).toBeUndefined();
  expect(renderValue({ type: "boolean" }, "true")).toBe("true");
  expect(renderValue({ type: "string" }, 'a"b')).toBe('"a\\"b"');
});

test("generate writes the config with secrets from the environment", () => {
  const out = generate(draft, schema);
  expect(out.toml).toContain('type = "cloudflare"');
  expect(out.toml).toContain('zone = "example.com"');
  expect(out.toml).toContain("ttl = 120");
  expect(out.toml).toContain('token = "${CLOUDFLARE_TOKEN}"');
  expect(out.env).toContain("CLOUDFLARE_TOKEN=");
  expect(out.missing).toEqual([]);
});

test("generate lists required fields that are empty", () => {
  const out = generate(
    { ...draft, provider: { type: "cloudflare", values: {} } },
    schema,
  );
  expect(out.missing).toEqual(["cloudflare.zone"]);
});

test("a generated config is read back by usageOf", () => {
  const usage = usageOf(generate(draft, schema).toml);
  expect(usage.plugins).toEqual([
    { kind: "retriever", name: "ipify" },
    { kind: "provider", name: "cloudflare" },
  ]);
  expect(usage.ping).toBe(false);
});

test("a secret chosen to live in a file is read with ${file:...}", () => {
  const out = generate(draft, schema, new Set(["cloudflare.token"]));
  expect(out.toml).toContain(
    'token = "${file:/etc/dnspatch/secrets/cloudflare_token}"',
  );
  expect(out.files).toEqual(["cloudflare_token"]);
  expect(out.env).toBe("");
});

test("usageOf finds definitions, notifiers and ping_url", () => {
  const usage = usageOf(`
[provider.main]
type = "regru"

[notify.alerts]
type = "mqtt"

[[instance]]
name = "a"
ping_url = "https://hc-ping.com/x"

[[instance.retriever]]
type = "ipify"

[[instance.provider]]
ref = "main"
`);
  expect(usage.plugins).toEqual([
    { kind: "provider", name: "regru" },
    { kind: "notifier", name: "mqtt" },
    { kind: "retriever", name: "ipify" },
  ]);
  expect(usage.ping).toBe(true);
});

test("usageOf throws on invalid TOML", () => {
  expect(() => usageOf("not = = toml")).toThrow();
});
