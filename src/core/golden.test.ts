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
import { envName, generate, secretsDir } from "./toml";

// Checks the generated configs against the real thing: set DNSPATCH_BIN to a
// dnspatch binary of the same release as the schema in public/schema.
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

describe.skipIf(!ready)("generated configs pass dnspatch -check-config", () => {
  const schema = (
    ready ? JSON.parse(readFileSync(schemaPath, "utf8")) : undefined
  ) as Schema;
  if (ready) expect(isSchema(schema)).toBe(true);

  for (const provider of featured.provider) {
    test(provider, () => {
      const plugin = schema.plugins.find(
        (p) => p.kind === "provider" && p.name === provider,
      );
      expect(plugin, `${provider} is in the ${tag} schema`).toBeDefined();

      const values: Record<string, string> = {};
      const env = { ...process.env } as Record<string, string>;
      for (const f of plugin?.fields ?? []) {
        if (!f.required) continue;
        if (f.secret) env[envName(provider, f.name)] = "secret";
        else values[f.name] = f.example ?? "x";
      }

      const out = generate(
        {
          name: "home",
          interval: "5m",
          retriever: { type: featured.retriever[0], values: {} },
          provider: { type: provider, values },
        },
        schema,
        fileSecrets,
      );
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
      // Throws, with dnspatch's own message, when the config is rejected.
      execFileSync(bin as string, ["-check-config", "-config", file], {
        env,
        stdio: "pipe",
      });
    });
  }
});
