import { expect, test } from "vitest";
import { findPlugin, isSchema, type Schema } from "./schema";

const sample: Schema = {
  schema_version: 1,
  plugins: [
    {
      kind: "provider",
      name: "cloudflare",
      build_tags: ["cloudflare", "providers_all"],
      fields: [],
    },
    {
      kind: "retriever",
      name: "ipify",
      build_tags: ["ipify", "retrievers_all"],
      fields: [],
    },
  ],
};

test("isSchema accepts version 1 and rejects other shapes", () => {
  expect(isSchema(sample)).toBe(true);
  expect(isSchema({ ...sample, schema_version: 2 })).toBe(false);
  expect(isSchema(null)).toBe(false);
  expect(isSchema({ schema_version: 1 })).toBe(false);
});

test("findPlugin matches kind and name", () => {
  expect(findPlugin(sample, "provider", "cloudflare")?.name).toBe("cloudflare");
  expect(findPlugin(sample, "retriever", "cloudflare")).toBeUndefined();
});
