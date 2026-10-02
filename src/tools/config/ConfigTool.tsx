import { useMemo, useState } from "preact/hooks";
import { featured, fileSecrets, pluginInfo } from "../../content/plugins";
import type { Schema } from "../../core/schema";
import { findPlugin } from "../../core/schema";
import {
  type ConfigDraft,
  type Generated,
  generate,
  secretsDir,
} from "../../core/toml";
import { t, useLang } from "../../i18n";
import { CodeBlock } from "../CodeBlock";
import { FieldsEditor } from "./FieldsEditor";
import { NotifierSection } from "./NotifierSection";
import { RetrieverSection } from "./RetrieverSection";

/** compose.yml for the files the generated config needs. */
function composeFor(result: Generated): string {
  const lines = [
    "services:",
    "  dnspatch:",
    `    image: krimsn/dnspatch:${result.full ? "latest-full" : "latest"}`,
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
    retrievers: [{ type: featured.retriever[0], values: {} }],
    provider: { type: provider, values: {} },
    notifiers: [],
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

  return (
    <section>
      <h1>{t("configTitle")}</h1>
      <p>{t("configIntro")}</p>

      <div class="layout">
        <div class="steps">
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
          {provider && (
            <FieldsEditor
              kind="provider"
              plugin={provider}
              values={draft.provider.values}
              onChange={(field, value) =>
                setDraft((d) => ({
                  ...d,
                  provider: {
                    ...d.provider,
                    values: { ...d.provider.values, [field]: value },
                  },
                }))
              }
            />
          )}

          <h2>{t("stepAddress")}</h2>
          <RetrieverSection
            retrievers={draft.retrievers}
            onChange={(retrievers) => setDraft((d) => ({ ...d, retrievers }))}
          />

          <NotifierSection
            schema={schema}
            notifiers={draft.notifiers}
            onChange={(notifiers) => setDraft((d) => ({ ...d, notifiers }))}
          />
        </div>

        <aside class="result">
          <h2>{t("stepResult")}</h2>
          {result.missing.length > 0 && (
            <p class="warn">
              {t("missing", {
                fields: result.missing
                  .map((m) => m.split(".")[1] ?? m)
                  .join(", "),
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
        </aside>
      </div>
    </section>
  );
}
