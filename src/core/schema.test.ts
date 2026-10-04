import { expect, test } from "vitest";
import {
  findPlugin,
  inDefaultBuild,
  isSchema,
  pingNeedsFull,
  type Schema,
} from "./schema";

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

test("an older schema has every retriever and provider in the default build and ping only in the full one", () => {
  expect(sample.plugins.map(inDefaultBuild)).toEqual([true, true]);
  expect(
    inDefaultBuild({
      kind: "notifier",
      name: "mqtt",
      build_tags: ["mqtt"],
      fields: [],
    }),
  ).toBe(false);
  expect(pingNeedsFull(sample)).toBe(true);
});

test("a schema that says what the default build has puts ping in every build", () => {
  const current: Schema = {
    schema_version: 1,
    plugins: [
      {
        kind: "provider",
        name: "rfc2136",
        build_tags: ["rfc2136", "full"],
        in_default_build: false,
        fields: [],
      },
    ],
  };
  expect(current.plugins.map(inDefaultBuild)).toEqual([false]);
  expect(pingNeedsFull(current)).toBe(false);
});
