import { expect, test } from "vitest";
import type { Schema } from "./schema";
import { advise, minimalTags } from "./tags";

const schema: Schema = {
  schema_version: 1,
  plugins: [
    {
      kind: "retriever",
      name: "ipify",
      build_tags: ["ipify", "retrievers_all"],
      fields: [],
    },
    {
      kind: "provider",
      name: "cloudflare",
      build_tags: ["cloudflare", "providers_all"],
      fields: [],
    },
    {
      kind: "notifier",
      name: "mqtt",
      build_tags: ["mqtt", "notify_all"],
      fields: [],
    },
  ],
};

test("minimalTags names each plugin after dnspatch_none, sorted", () => {
  const usage = {
    plugins: [
      { kind: "retriever", name: "ipify" },
      { kind: "provider", name: "cloudflare" },
    ],
    ping: false,
  } as const;
  expect(minimalTags(schema, usage).tags).toEqual([
    "dnspatch_none",
    "cloudflare",
    "ipify",
  ]);
});

test("minimalTags reports plugins the release does not know", () => {
  const usage = {
    plugins: [{ kind: "provider", name: "nope" }],
    ping: false,
  } as const;
  expect(minimalTags(schema, usage)).toEqual({
    tags: ["dnspatch_none"],
    unknown: ["provider/nope"],
  });
});

test("advise: default plugins need no build", () => {
  const usage = {
    plugins: [{ kind: "provider", name: "cloudflare" }],
    ping: false,
  } as const;
  expect(advise(schema, usage).build).toBe("official");
});

test("advise: ping or a notifier points to the full flavour", () => {
  expect(advise(schema, { plugins: [], ping: true }).build).toBe("full");
  expect(
    advise(schema, {
      plugins: [{ kind: "notifier", name: "mqtt" }],
      ping: false,
    }).build,
  ).toBe("full");
});

test("ping adds its tag", () => {
  expect(minimalTags(schema, { plugins: [], ping: true }).tags).toEqual([
    "dnspatch_none",
    "ping",
  ]);
});
