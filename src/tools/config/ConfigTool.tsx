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
import { zip } from "../../core/zip";
import { sendToBuild } from "../../handoff";
import { t, useLang } from "../../i18n";
import { CodeBlock } from "../CodeBlock";
import { FieldsEditor } from "./FieldsEditor";
import { MonitorSection } from "./MonitorSection";
import { NotifierSection } from "./NotifierSection";
import { RetrieverSection } from "./RetrieverSection";
import { Step } from "./Step";

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

/** Hands the config, the .env and compose.yml to the browser as one archive. */
function downloadArchive(result: Generated) {
  const files = [
    { name: "compose.yml", text: composeFor(result) },
    { name: "dnspatch.toml", text: result.toml },
    ...(result.env ? [{ name: ".env", text: result.env }] : []),
  ];
  const blob = new Blob([zip(files)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dnspatch.zip";
  a.click();
  URL.revokeObjectURL(url);
}

function emptyDraft(provider: string): ConfigDraft {
  return {
    name: "home",
    interval: "5m",
    retrievers: featured.defaultRetrievers.map((type) => ({
      type,
      values: {},
    })),
    provider: { type: provider, values: {} },
    notifiers: [],
    ping: false,
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

  // What is still empty in the domain block, named as the form names it.
  const providerInfo = pluginInfo("provider", draft.provider.type);
  const missing = result.missing
    .filter((m) => m.startsWith(`${draft.provider.type}.`))
    .map((m) => {
      const field = m.split(".")[1] ?? m;
      return providerInfo?.fields[field]?.label[lang] ?? field;
    });

  const titleOf = (kind: string, name: string) =>
    pluginInfo(kind, name)?.title[lang] ?? name;

  return (
    <section>
      <h1>{t("configTitle")}</h1>
      <p>{t("configIntro")}</p>

      <div class="layout">
        <div class="steps">
          <Step
            title={t("stepProvider")}
            info={titleOf("provider", draft.provider.type)}
            warn={
              missing.length > 0
                ? t("missing", { fields: missing.join(", ") })
                : undefined
            }
            defaultOpen
          >
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

            <h3>{t("stepFields")}</h3>
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
          </Step>

          <Step
            title={t("stepAddress")}
            info={draft.retrievers
              .map((r) => titleOf("retriever", r.type))
              .join(" → ")}
            defaultOpen
          >
            <RetrieverSection
              retrievers={draft.retrievers}
              onChange={(retrievers) => setDraft((d) => ({ ...d, retrievers }))}
            />
          </Step>

          <Step
            title={t("stepMonitor")}
            info={draft.ping ? t("sumOn") : t("sumOff")}
          >
            <MonitorSection
              ping={draft.ping}
              onChange={(ping) => setDraft((d) => ({ ...d, ping }))}
            />
          </Step>

          <Step
            title={t("stepNotify")}
            info={
              draft.notifiers.length > 0
                ? draft.notifiers
                    .map((n) => titleOf("notifier", n.type))
                    .join(", ")
                : t("sumNone")
            }
          >
            <NotifierSection
              schema={schema}
              notifiers={draft.notifiers}
              onChange={(notifiers) => setDraft((d) => ({ ...d, notifiers }))}
            />
          </Step>
        </div>

        <aside class="result">
          <h2>{t("stepResult")}</h2>
          <button
            type="button"
            class="primary"
            onClick={() => downloadArchive(result)}
          >
            {t("downloadAll")}
          </button>
          <CodeBlock title="dnspatch.toml" text={result.toml} />
          {result.env && <CodeBlock title=".env" text={result.env} />}

          <h2>{t("runTitle")}</h2>
          <p>{t("runFiles", { files: filesFor(result).join(", ") })}</p>
          <CodeBlock title="compose.yml" text={composeFor(result)} />
          <CodeBlock title="" text="docker compose up -d" />
          <p class="hint">{t("runMore")}</p>

          <h2>{t("toBuildTitle")}</h2>
          <p>{t("toBuildHint")}</p>
          <button type="button" onClick={() => sendToBuild(result.toml)}>
            {t("toBuild")}
          </button>
        </aside>
      </div>
    </section>
  );
}
