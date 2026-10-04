import { execFileSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { featured, fileSecrets } from "../content/plugins";
import { isSchema, type Schema } from "./schema";
import {
  type ConfigDraft,
  envName,
  eventTypes,
  generate,
  secretsDir,
} from "./toml";

// Checks the generated configs against the real thing: set DNSPATCH_BIN to a
// dnspatch binary of the same release as the schema in public/schema, with every
// plugin compiled in so that notifiers are accepted: -tags full, or
// -tags "ping,notify_all" for a release that comes before the full tag.
const bin = process.env.DNSPATCH_BIN;
const tag = process.env.DNSPATCH_TAG ?? "v0.4.4-rc.1";
const schemaPath = join(
  import.meta.dirname,
  "..",
  "..",
  "public",
  "schema",
  `${tag}.json`,
);
// An authorized key of Yandex Cloud: dnspatch parses the private key at check time.
const fakeKey = JSON.stringify({
  id: "id",
  service_account_id: "sa",
  private_key: generateKeyPairSync("rsa", { modulusLength: 2048 })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString(),
});
const ready = bin !== undefined && existsSync(schemaPath);

/** Required fields of a plugin filled with its examples; secrets go to the environment. */
function filled(
  schema: Schema,
  kind: string,
  name: string,
  env: NodeJS.ProcessEnv,
) {
  const plugin = schema.plugins.find((p) => p.kind === kind && p.name === name);
  expect(plugin, `${kind}/${name} is in the ${tag} schema`).toBeDefined();
  const values: Record<string, string> = {};
  for (const f of plugin?.fields ?? []) {
    if (!f.required) continue;
    if (f.secret) {
      env[envName(name, f.name)] =
        kind === "notifier" ? (notifierAddress[name] ?? "x") : "secret";
    } else values[f.name] = f.example ?? "x";
  }
  return values;
}

const notifierAddress: Record<string, string> = {
  mqtt: "mqtt://user:pass@localhost:1883",
  rabbitmq: "amqp://user:pass@localhost:5672/",
  redis: "redis://:pass@localhost:6379/0",
};

/** Writes the draft's config and asks dnspatch to validate it; throws with its message when rejected. */
function check(schema: Schema, draft: ConfigDraft, env: NodeJS.ProcessEnv) {
  const out = generate(draft, schema, fileSecrets);
  expect(out.missing).toEqual([]);

  // The secret files live under /etc/dnspatch/secrets in the container;
  // here they are written to a temporary directory and the paths point there.
  const dir = mkdtempSync(join(tmpdir(), "builder-"));
  const secrets = join(dir, "secrets");
  mkdirSync(secrets);
  for (const name of out.files) writeFileSync(join(secrets, name), fakeKey);

  const file = join(dir, "dnspatch.toml");
  writeFileSync(
    file,
    out.toml.replaceAll(secretsDir, secrets.replaceAll("\\", "/")),
  );
  execFileSync(bin as string, ["-check-config", "-config", file], {
    env,
    stdio: "pipe",
  });
}

describe.skipIf(!ready)("generated configs pass dnspatch -check-config", () => {
  const schema = (
    ready ? JSON.parse(readFileSync(schemaPath, "utf8")) : undefined
  ) as Schema;
  if (ready) expect(isSchema(schema)).toBe(true);

  const base = (provider: string, env: NodeJS.ProcessEnv): ConfigDraft => ({
    name: "home",
    interval: "5m",
    retrievers: [{ type: featured.retriever[0], values: {} }],
    provider: {
      type: provider,
      values: filled(schema, "provider", provider, env),
    },
    notifiers: [],
    ping: false,
  });

  for (const provider of featured.provider) {
    test(`provider ${provider}`, () => {
      const env = { ...process.env };
      check(schema, base(provider, env), env);
    });
  }

  test("monitoring with ping_url", () => {
    const env = { ...process.env, PING_URL: "https://hc-ping.com/uuid" };
    check(schema, { ...base("cloudflare", env), ping: true }, env);
  });

  test("the chain a new config starts with", () => {
    const env = { ...process.env };
    check(
      schema,
      {
        ...base("cloudflare", env),
        retrievers: featured.defaultRetrievers.map((type) => ({
          type,
          values: {},
        })),
      },
      env,
    );
  });

  test("every retriever at once, as a chain", () => {
    const env = { ...process.env };
    const draft = base("cloudflare", env);
    check(
      schema,
      {
        ...draft,
        retrievers: featured.retriever.map((type) => ({ type, values: {} })),
      },
      env,
    );
  });

  for (const notifier of featured.notifier) {
    test(`notifier ${notifier} with every event`, () => {
      const env = { ...process.env };
      const draft = base("cloudflare", env);
      check(
        schema,
        {
          ...draft,
          notifiers: [
            {
              type: notifier,
              values: filled(schema, "notifier", notifier, env),
              events: eventTypes,
            },
          ],
        },
        env,
      );
    });
  }

  test("all notifiers together", () => {
    const env = { ...process.env };
    const draft = base("cloudflare", env);
    check(
      schema,
      {
        ...draft,
        notifiers: featured.notifier.map((type) => ({
          type,
          values: filled(schema, "notifier", type, env),
          events: ["status", "ip_change"],
        })),
      },
      env,
    );
  });
});
