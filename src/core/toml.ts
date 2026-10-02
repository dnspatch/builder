import { parse } from "smol-toml";
import type { Field, Kind, Plugin, Schema } from "./schema";
import { findPlugin } from "./schema";

/** One plugin chosen in the constructor with the values typed for its fields. */
export interface PluginChoice {
  type: string;
  values: Record<string, string>;
}

/** A notifier also chooses which events it is sent. */
export interface NotifierChoice extends PluginChoice {
  events: readonly string[];
}

/** Event types a notifier can publish; `status` is what it gets when `events` is not set. */
export const eventTypes = [
  "status",
  "provider_status",
  "retriever_status",
  "ip_change",
  "cycle",
  "lifecycle",
] as const;

/** Everything the constructor collects; a single instance in this version. */
export interface ConfigDraft {
  name: string;
  interval: string;
  /** In polling order: the first is the main one, the rest are tried when it fails. */
  retrievers: readonly PluginChoice[];
  provider: PluginChoice;
  notifiers: readonly NotifierChoice[];
  /** Call a monitoring URL after every cycle (`ping_url`); the URL itself stays in the environment. */
  ping: boolean;
}

/** Environment variable that carries the monitoring URL: it holds a secret key. */
export const pingEnv = "PING_URL";

export interface Generated {
  /** Notifiers and pings exist only in the -full flavour, so the config needs that image. */
  full: boolean;
  toml: string;
  /** Template of the environment file that holds the secrets. */
  env: string;
  /** Names of required fields that are still empty. */
  missing: string[];
  /** Secrets kept in files, as names inside the secrets directory. */
  files: string[];
}

/** Where the secret files are mounted inside the container. */
export const secretsDir = "/etc/dnspatch/secrets";

/** Name of the file that carries a secret field, e.g. yandexcloud_key. */
export function secretFileName(plugin: string, field: string): string {
  return `${plugin}_${field}`.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

/** `plugin.field` of the secrets that are read from a file instead of the environment. */
export type FileSecrets = ReadonlySet<string>;

/** Name of the environment variable that carries a secret field, e.g. CLOUDFLARE_TOKEN. */
export function envName(plugin: string, field: string): string {
  return `${plugin}_${field}`.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function quote(s: string): string {
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

/** Renders a typed value, or undefined when the text does not fit the type. */
export function renderValue(
  field: Pick<Field, "type">,
  raw: string,
): string | undefined {
  const v = raw.trim();
  switch (field.type) {
    case "boolean":
      return v === "true" || v === "false" ? v : undefined;
    case "integer":
      return /^-?\d+$/.test(v) ? v : undefined;
    case "number":
      return /^-?\d+(\.\d+)?$/.test(v) ? v : undefined;
    case "string":
    case "duration":
      return quote(raw);
    default:
      return undefined;
  }
}

function pluginLines(
  prefix: string,
  plugin: Plugin,
  choice: PluginChoice,
  out: { env: string[]; missing: string[]; files: string[] },
  fileSecrets: FileSecrets,
  extra: readonly string[] = [],
): string[] {
  const lines = [`[[${prefix}]]`, `type = ${quote(plugin.name)}`];
  for (const field of plugin.fields) {
    if (field.secret) {
      // A secret is never typed into the page: the config reads it from the environment.
      if (!field.required && !(choice.values[field.name] ?? "").trim())
        continue;
      if (fileSecrets.has(`${plugin.name}.${field.name}`)) {
        const file = secretFileName(plugin.name, field.name);
        lines.push(
          `${field.name} = ${quote(`\${file:${secretsDir}/${file}}`)}`,
        );
        out.files.push(file);
        continue;
      }
      const name = envName(plugin.name, field.name);
      lines.push(`${field.name} = ${quote(`\${${name}}`)}`);
      out.env.push(`${name}=`);
      continue;
    }
    const raw = choice.values[field.name] ?? "";
    if (raw.trim() === "") {
      if (field.required) {
        out.missing.push(`${plugin.name}.${field.name}`);
        lines.push(`${field.name} = ""`);
      }
      continue;
    }
    const rendered = renderValue(field, raw);
    if (rendered === undefined) {
      out.missing.push(`${plugin.name}.${field.name}`);
      continue;
    }
    lines.push(`${field.name} = ${rendered}`);
  }
  return [...lines, ...extra];
}

/** The `events` line, left out when it would only repeat the default. */
function eventsLine(events: readonly string[]): string[] {
  const chosen = eventTypes.filter((e) => events.includes(e));
  if (chosen.length === 0 || (chosen.length === 1 && chosen[0] === "status"))
    return [];
  return [`events = [${chosen.map(quote).join(", ")}]`];
}

/** Writes the configuration for the draft. The schema decides which fields exist and which are secret. */
export function generate(
  draft: ConfigDraft,
  schema: Schema,
  fileSecrets: FileSecrets = new Set(),
): Generated {
  const provider = findPlugin(schema, "provider", draft.provider.type);
  if (!provider) throw new Error(`unknown provider ${draft.provider.type}`);

  const out = {
    env: [] as string[],
    missing: [] as string[],
    files: [] as string[],
  };
  if (draft.retrievers.length === 0) out.missing.push("retriever");

  // Blocks of the instance, each followed by an empty line.
  const blocks: string[][] = [];
  const add = (
    kind: Kind,
    prefix: string,
    choice: PluginChoice,
    extra: readonly string[] = [],
  ) => {
    const plugin = findPlugin(schema, kind, choice.type);
    if (!plugin) throw new Error(`unknown ${kind} ${choice.type}`);
    blocks.push(pluginLines(prefix, plugin, choice, out, fileSecrets, extra));
  };
  for (const r of draft.retrievers) add("retriever", "instance.retriever", r);
  add("provider", "instance.provider", draft.provider);
  for (const n of draft.notifiers)
    add("notifier", "instance.notify", n, eventsLine(n.events));
  if (draft.ping) out.env.push(`${pingEnv}=`);

  // Only the sources of secrets this config really uses are mentioned.
  const notes: string[] = [];
  if (out.env.length > 0)
    notes.push(
      "# Values like ${NAME} are read from the environment; see the .env file.",
    );
  if (out.files.length > 0)
    notes.push(
      "# Values like ${file:...} are read from files; see the secrets folder.",
    );

  const toml = [
    "# Generated by dnspatch builder. Save as dnspatch.toml.",
    ...notes,
    "",
    `interval = ${quote(draft.interval || "5m")}`,
    "",
    "[[instance]]",
    `name = ${quote(draft.name || "home")}`,
    ...(draft.ping ? [`ping_url = ${quote(`\${${pingEnv}}`)}`] : []),
    "",
    ...blocks.flatMap((b) => [...b, ""]),
  ].join("\n");

  const env = out.env.length
    ? `${["# Secrets for dnspatch. Fill in the values and keep this file private.", ...out.env].join("\n")}\n`
    : "";
  return {
    full: draft.notifiers.length > 0 || draft.ping,
    toml,
    env,
    missing: out.missing,
    files: out.files,
  };
}

export interface UsedPlugin {
  kind: Kind;
  name: string;
}

export interface Usage {
  plugins: readonly UsedPlugin[];
  /** An instance sets ping_url, which needs the "ping" build tag. */
  ping: boolean;
}

const kinds: Record<string, Kind> = {
  retriever: "retriever",
  provider: "provider",
  notify: "notifier",
};

function isTable(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Reads a pasted configuration and lists the plugin types and features it uses. Throws on invalid TOML. */
export function usageOf(text: string): Usage {
  const doc = parse(text);
  const found = new Map<string, UsedPlugin>();
  let ping = false;

  const add = (kind: Kind, table: unknown) => {
    if (isTable(table) && typeof table.type === "string")
      found.set(`${kind}/${table.type}`, { kind, name: table.type });
  };

  for (const [key, kind] of Object.entries(kinds)) {
    // Definitions: [retriever.<name>], [provider.<name>], [notify.<name>].
    const defs = doc[key];
    if (isTable(defs)) for (const def of Object.values(defs)) add(kind, def);
  }

  const instances = doc.instance;
  if (Array.isArray(instances)) {
    for (const inst of instances) {
      if (!isTable(inst)) continue;
      if (typeof inst.ping_url === "string" && inst.ping_url !== "")
        ping = true;
      for (const [key, kind] of Object.entries(kinds)) {
        const list = inst[key];
        if (Array.isArray(list)) for (const item of list) add(kind, item);
      }
    }
  }
  return { plugins: [...found.values()], ping };
}
