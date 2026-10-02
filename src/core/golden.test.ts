import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { featured } from "../content/plugins";
import { isSchema, type Schema } from "./schema";
import { envName, generate } from "./toml";

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
      const values: Record<string, string> = {};
      const env: Record<string, string> = { ...process.env } as Record<
        string,
        string
      >;
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
      );
      expect(out.missing).toEqual([]);

      const file = join(
        mkdtempSync(join(tmpdir(), "builder-")),
        "dnspatch.toml",
      );
      writeFileSync(file, out.toml);
      // Throws, with dnspatch's own message, when the config is rejected.
      execFileSync(bin as string, ["-check-config", "-config", file], {
        env,
        stdio: "pipe",
      });
    });
  }
});
