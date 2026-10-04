/** Shape of schema.json, format version 1, published with every dnspatch release. */
export type Kind = "retriever" | "provider" | "notifier";

export type FieldType =
  | "string"
  | "boolean"
  | "integer"
  | "number"
  | "duration"
  | "array"
  | "table";

export interface Field {
  /** A field of a nested table is written as `table.key`. */
  name: string;
  type: FieldType;
  required: boolean;
  /** Set when the field is required only if its optional table is present. */
  required_if?: string;
  default?: string;
  example?: string;
  description: string;
  /** Holds a password or a key; may be given as `${VAR}` or `${file:...}`. */
  secret: boolean;
}

export interface Plugin {
  kind: Kind;
  /** The `type` value in the configuration. */
  name: string;
  /** Any one of them compiles the plugin in. */
  build_tags: string[];
  /**
   * Whether a build made without tags has the plugin. Releases that come before
   * the `full` tag do not say; see `inDefaultBuild`.
   */
  in_default_build?: boolean;
  fields: Field[];
}

export interface Schema {
  schema_version: 1;
  plugins: Plugin[];
}

export interface SchemaIndex {
  default: string;
  versions: { tag: string; prerelease: boolean }[];
}

/**
 * Says whether the ready-made image has the plugin. Older releases leave
 * `in_default_build` out and had every retriever and provider in the ready-made
 * image and every notifier in the -full one.
 */
export function inDefaultBuild(plugin: Plugin): boolean {
  return plugin.in_default_build ?? plugin.kind !== "notifier";
}

/**
 * Says whether `ping_url` needs the -full image. It did in the releases that
 * come before the `full` tag, which are the ones whose schema has no
 * `in_default_build`; since then the hook is in every build.
 */
export function pingNeedsFull(schema: Schema): boolean {
  return !schema.plugins.some((p) => p.in_default_build !== undefined);
}

export function isSchema(value: unknown): value is Schema {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { schema_version?: unknown; plugins?: unknown };
  return v.schema_version === 1 && Array.isArray(v.plugins);
}

/** Finds a plugin by kind and `type` name. */
export function findPlugin(
  schema: Schema,
  kind: Kind,
  name: string,
): Plugin | undefined {
  return schema.plugins.find((p) => p.kind === kind && p.name === name);
}

/** Loads a release schema bundled with the site. `base` is the site root URL. */
export async function loadSchema(
  tag: string,
  base = import.meta.env.BASE_URL,
): Promise<Schema> {
  const res = await fetch(`${base}schema/${tag}.json`);
  if (!res.ok) throw new Error(`schema ${tag}: ${res.status}`);
  const data: unknown = await res.json();
  if (!isSchema(data)) throw new Error(`schema ${tag}: unsupported format`);
  return data;
}

export async function loadIndex(
  base = import.meta.env.BASE_URL,
): Promise<SchemaIndex> {
  const res = await fetch(`${base}schema/index.json`);
  if (!res.ok) throw new Error(`schema index: ${res.status}`);
  return (await res.json()) as SchemaIndex;
}
