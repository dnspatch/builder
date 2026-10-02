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

  return (
    <section>
      <h1>{t("buildTitle")}</h1>
      <p>{t("buildIntro")}</p>

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

      <h2>{t("orPick")}</h2>
      {kinds.map((kind) => (
        <fieldset key={kind}>
          <legend>{t(kindKeys[kind])}</legend>
          {schema.plugins
            .filter((p) => p.kind === kind)
            .map((p) => {
              const key = `${kind}/${p.name}`;
              return (
                <label class="check" key={key}>
                  <input
                    type="checkbox"
                    checked={picked.has(key)}
                    onChange={() => toggle(key)}
                  />
                  {pluginInfo(kind, p.name)?.title[lang] ?? p.name}
                </label>
              );
            })}
        </fieldset>
      ))}
      <label class="check">
        <input
          type="checkbox"
          checked={ping}
          onChange={(e) => setPing(e.currentTarget.checked)}
        />
        {t("needPing")}
      </label>

      <h2>{t("verdict")}</h2>
      {!advice && <p class="hint">{t("nothingYet")}</p>}
      {advice && (
        <>
          <p>
            {advice.build === "official"
              ? t("verdictOfficial")
              : t("verdictFull")}
          </p>
          {advice.unknown.length > 0 && (
            <p class="warn">
              {t("unknownPlugins", { list: advice.unknown.join(", ") })}
            </p>
          )}
          <h3>{t("readyImage")}</h3>
          <CodeBlock
            title=""
            text={`docker pull krimsn/dnspatch:latest${advice.build === "full" ? "-full" : ""}`}
          />

          <details>
            <summary>{t("customTitle")}</summary>
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
          </details>
        </>
      )}
    </section>
  );
}
