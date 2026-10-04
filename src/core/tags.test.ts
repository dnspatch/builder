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

// A release since the `full` tag: the schema says what a build without tags has.
const current: Schema = {
  schema_version: 1,
  plugins: [
    {
      kind: "retriever",
      name: "ipify",
      build_tags: ["ipify", "full"],
      in_default_build: true,
      fields: [],
    },
    {
      kind: "provider",
      name: "cloudflare",
      build_tags: ["cloudflare", "full"],
      in_default_build: true,
      fields: [],
    },
    {
      kind: "provider",
      name: "rfc2136",
      build_tags: ["rfc2136", "full"],
      in_default_build: false,
      fields: [],
    },
    {
      kind: "notifier",
      name: "mqtt",
      build_tags: ["mqtt", "full"],
      in_default_build: false,
      fields: [],
    },
  ],
};

test("a plugin that the default build leaves out points to the full flavour", () => {
  for (const [kind, name] of [
    ["provider", "rfc2136"],
    ["notifier", "mqtt"],
  ] as const) {
    expect(
      advise(current, { plugins: [{ kind, name }], ping: false }).build,
    ).toBe("full");
  }
  expect(
    advise(current, {
      plugins: [{ kind: "provider", name: "cloudflare" }],
      ping: false,
    }).build,
  ).toBe("official");
});

test("ping needs neither the full flavour nor a tag since the release that has it everywhere", () => {
  const advice = advise(current, { plugins: [], ping: true });
  expect(advice.build).toBe("official");
  expect(advice.tags).toEqual(["dnspatch_none"]);
});

test("the tag of a plugin outside the default build is named like the plugin", () => {
  const usage = {
    plugins: [
      { kind: "provider", name: "rfc2136" },
      { kind: "retriever", name: "ipify" },
    ],
    ping: false,
  } as const;
  expect(minimalTags(current, usage).tags).toEqual([
    "dnspatch_none",
    "ipify",
    "rfc2136",
  ]);
});
