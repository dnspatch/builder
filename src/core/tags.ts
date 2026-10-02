/** Build tags for a set of plugins. The real mapping comes from the release schema. */
export function tagsFor(plugins: readonly string[]): string[] {
  return ["dnspatch_none", ...[...plugins].sort()];
}
