import { useMemo, useState } from "preact/hooks";
import {
  featured,
  fileSecrets,
  hiddenFields,
  pluginInfo,
} from "../../content/plugins";
import type { Field, Schema } from "../../core/schema";
import { findPlugin } from "../../core/schema";
import {
  type ConfigDraft,
  envName,
  type Generated,
  generate,
  secretFileName,
  secretsDir,
} from "../../core/toml";
import { t, useLang } from "../../i18n";
import { CodeBlock } from "../CodeBlock";

/** compose.yml for the files the generated config needs. */
function composeFor(result: Generated): string {
  const lines = [
    "services:",
    "  dnspatch:",
    "    image: krimsn/dnspatch:latest",
    "    restart: unless-stopped",
  ];
  if (result.env) lines.push("    env_file: .env");
  lines.push(
    "    volumes:",
    "      - ./dnspatch.toml:/etc/dnspatch/config.toml:ro",
  );
  if (result.files.length > 0) lines.push(`      - ./secrets:${secretsDir}:ro`);
  return `${lines.join("\n")}\n`;
}

/** Names of the files the user has to put next to compose.yml. */
function filesFor(result: Generated): string[] {
  return [
    "compose.yml",
    "dnspatch.toml",
    ...(result.env ? [".env"] : []),
    ...result.files.map((f) => `secrets/${f}`),
  ];
}

function emptyDraft(provider: string): ConfigDraft {
  return {
    name: "home",
    interval: "5m",
    retriever: { type: featured.retriever[0], values: {} },
    provider: { type: provider, values: {} },
  };
}

export function ConfigTool({ schema }: { schema: Schema }) {
  const lang = useLang();
  const [draft, setDraft] = useState(() => emptyDraft(featured.provider[0]));

  const provider = findPlugin(schema, "provider", draft.provider.type);
  const result = useMemo(
    () => generate(draft, schema, fileSecrets),
    [draft, schema],
  );

  const setValue = (field: string, value: string) =>
    setDraft((d) => ({
      ...d,
      provider: {
        ...d.provider,
        values: { ...d.provider.values, [field]: value },
      },
    }));

  const fields = (provider?.fields ?? []).filter(
    (f) => !hiddenFields.has(f.name),
  );
  const info = pluginInfo("provider", draft.provider.type);
  const main = fields.filter((f) => f.required);
  const more = fields.filter((f) => !f.required);

  const renderField = (f: Field) => {
    const finfo = info?.fields[f.name];
    const label = finfo?.label[lang] ?? f.name;
    const id = `f-${f.name}`;
    if (f.secret) {
      return (
        <div class="field" key={f.name}>
          <span class="label">{label}</span>
          {finfo?.where && <p class="hint">{finfo.where[lang]}</p>}
          <p class="secret">
            {fileSecrets.has(`${draft.provider.type}.${f.name}`)
              ? t("secretFile", {
                  name: secretFileName(draft.provider.type, f.name),
                })
              : t("secretField", {
                  name: envName(draft.provider.type, f.name),
                })}
          </p>
        </div>
      );
    }
    const value = draft.provider.values[f.name] ?? "";
    return (
      <div class="field" key={f.name}>
        <label class="label" for={id}>
          {label}
        </label>
        {f.type === "boolean" ? (
          <input
            id={id}
            type="checkbox"
            checked={value === "true"}
            onChange={(e) =>
              setValue(f.name, e.currentTarget.checked ? "true" : "")
            }
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            placeholder={finfo?.example ?? f.example ?? f.default ?? ""}
            onInput={(e) => setValue(f.name, e.currentTarget.value)}
          />
        )}
        {finfo?.where && <p class="hint">{finfo.where[lang]}</p>}
      </div>
    );
  };

  return (
    <section>
      <h1>{t("configTitle")}</h1>
      <p>{t("configIntro")}</p>

      <h2>{t("stepProvider")}</h2>
      <p class="hint">{t("stepProviderHelp")}</p>
      <div class="cards" role="radiogroup">
        {featured.provider.map((name) => {
          const p = pluginInfo("provider", name);
          const selected = draft.provider.type === name;
          return (
            <label class={selected ? "card selected" : "card"} key={name}>
              <input
                type="radio"
                name="provider"
                checked={selected}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    provider: { type: name, values: {} },
                  }))
                }
              />
              <strong>{p?.title[lang] ?? name}</strong>
              <span>{p?.summary[lang]}</span>
            </label>
          );
        })}
      </div>

      <h2>{t("stepFields")}</h2>
      {main.map(renderField)}
      {more.length > 0 && (
        <details>
          <summary>{t("moreOptions")}</summary>
          {more.map(renderField)}
        </details>
      )}

      <h2>{t("stepAddress")}</h2>
      <p>{t("addressText")}</p>

      <h2>{t("stepResult")}</h2>
      {result.missing.length > 0 && (
        <p class="warn">
          {t("missing", {
            fields: result.missing.map((m) => m.split(".")[1]).join(", "),
          })}
        </p>
      )}
      <CodeBlock title="dnspatch.toml" text={result.toml} />
      {result.env && <CodeBlock title=".env" text={result.env} />}

      <h2>{t("runTitle")}</h2>
      <p>{t("runFiles", { files: filesFor(result).join(", ") })}</p>
      <CodeBlock title="compose.yml" text={composeFor(result)} />
      <CodeBlock title="" text="docker compose up -d" />
      <p class="hint">{t("runMore")}</p>
    </section>
  );
}
