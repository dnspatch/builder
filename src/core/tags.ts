import type { Schema } from "./schema";
import { findPlugin } from "./schema";
import type { Usage } from "./toml";

export interface Advice {
  /**
   * official: the ready-made image or binary has everything.
   * full: monitoring pings or notifiers are needed, which the -full flavour has.
   */
  build: "official" | "full";
  /** Tags of the smallest build that holds the plugins, for those who want a small binary. */
  tags: string[];
  /** Plugins of the config that this release does not know. */
  unknown: string[];
}

/**
 * Tags for the smallest build that holds the given plugins. `dnspatch_none`
 * switches the default retrievers and providers off, so each one used is named.
 */
export function minimalTags(
  schema: Schema,
  usage: Usage,
): { tags: string[]; unknown: string[] } {
  const named = new Set<string>();
  const unknown: string[] = [];
  for (const used of usage.plugins) {
    const plugin = findPlugin(schema, used.kind, used.name);
    if (!plugin) {
      unknown.push(`${used.kind}/${used.name}`);
      continue;
    }
    // The tag named like the plugin; the others (…_all) bring in whole groups.
    named.add(
      plugin.build_tags.find((t) => t === plugin.name) ??
        plugin.build_tags[0] ??
        plugin.name,
    );
  }
  if (usage.ping) named.add("ping");
  return { tags: ["dnspatch_none", ...[...named].sort()], unknown };
}

/** Says whether a ready-made image is enough, or a custom build is needed. */
export function advise(schema: Schema, usage: Usage): Advice {
  const { tags, unknown } = minimalTags(schema, usage);
  const needsFull =
    usage.ping || usage.plugins.some((p) => p.kind === "notifier");
  return { build: needsFull ? "full" : "official", tags, unknown };
}
