import { useMemo, useState } from "preact/hooks";
import { pluginInfo } from "../../content/plugins";
import type { Kind, Schema } from "../../core/schema";
import { advise } from "../../core/tags";
import { type Usage, type UsedPlugin, usageOf } from "../../core/toml";
import { t, useLang } from "../../i18n";
import { CodeBlock } from "../CodeBlock";

const kindKeys = {
  retriever: "kindRetriever",
  provider: "kindProvider",
  notifier: "kindNotifier",
} as const;

const kinds: Kind[] = ["retriever", "provider", "notifier"];

function usageFromConfig(text: string): {
  usage?: Usage;
  error?: string;
} {
  if (text.trim() === "") return {};
  try {
    return { usage: usageOf(text) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export function BuildTool({
  schema,
  version,
}: {
  schema: Schema;
  version: string;
}) {
  const lang = useLang();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [ping, setPing] = useState(false);

  const fromConfig = useMemo(() => usageFromConfig(text), [text]);

  // A pasted config wins; otherwise the hand-picked list is used.
  const usage: Usage | undefined = fromConfig.usage ?? fromPicks();
  function fromPicks(): Usage | undefined {
    if (picked.size === 0 && !ping) return undefined;
    const plugins: UsedPlugin[] = [...picked].map((key) => {
      const [kind, name] = key.split("/") as [Kind, string];
      return { kind, name };
    });
    return { plugins, ping };
  }

  const advice = usage ? advise(schema, usage) : undefined;
  const toggle = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const tags = advice?.tags.join(",") ?? "";
  const image = `krimsn/dnspatch:latest${advice?.build === "full" ? "-full" : ""}`;

  return (
    <section>
      <h1>{t("buildTitle")}</h1>
      <p>{t("buildIntro")}</p>

      <div class="layout">
        <div class="steps">
          <div class="panel">
            <label class="label" for="paste">
              {t("pasteLabel")}
            </label>
            <textarea
              id="paste"
              rows={8}
              spellcheck={false}
              value={text}
              onInput={(e) => setText(e.currentTarget.value)}
            />
            {fromConfig.error && (
              <p class="warn">{t("parseError", { error: fromConfig.error })}</p>
            )}
          </div>

          <div class="divider">{t("orPick")}</div>

          {kinds.map((kind) => (
            <fieldset class="panel" key={kind}>
              <legend>{t(kindKeys[kind])}</legend>
              <div class="chips">
                {schema.plugins
                  .filter((p) => p.kind === kind)
                  .map((p) => {
                    const key = `${kind}/${p.name}`;
                    return (
                      <label
                        class={picked.has(key) ? "chip on" : "chip"}
                        key={key}
                      >
                        <input
                          type="checkbox"
                          checked={picked.has(key)}
                          onChange={() => toggle(key)}
                        />
                        {pluginInfo(kind, p.name)?.title[lang] ?? p.name}
                      </label>
                    );
                  })}
              </div>
            </fieldset>
          ))}
          <fieldset class="panel">
            <legend>{t("needPing")}</legend>
            <div class="chips">
              <label class={ping ? "chip on" : "chip"}>
                <input
                  type="checkbox"
                  checked={ping}
                  onChange={(e) => setPing(e.currentTarget.checked)}
                />
                ping_url
              </label>
            </div>
          </fieldset>
        </div>

        <aside class="result">
          <h2>{t("verdict")}</h2>
          {!advice && <p class="hint">{t("nothingYet")}</p>}
          {advice && (
            <>
              <p>
                {t(
                  advice.build === "official"
                    ? "verdictOfficial"
                    : "verdictFull",
                  { image },
                )}
              </p>
              {advice.unknown.length > 0 && (
                <p class="warn">
                  {t("unknownPlugins", { list: advice.unknown.join(", ") })}
                </p>
              )}
              <CodeBlock title="" text={`docker pull ${image}`} />

              <h3>{t("customTitle")}</h3>
              <p class="hint">{t("customHelp")}</p>
              <p>
                {t("tagsLabel")}: <code>{tags}</code>
              </p>
              <CodeBlock
                title=""
                text={`go install -tags "${tags}" github.com/dnspatch/dnspatch/cmd/dnspatch@${version}`}
              />
              <CodeBlock
                title=""
                text={`docker build --build-arg TAGS="${tags}" -t dnspatch .`}
              />
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
