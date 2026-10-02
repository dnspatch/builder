import { useState } from "preact/hooks";
import { featured, pluginInfo } from "../../content/plugins";
import type { PluginChoice } from "../../core/toml";
import { t, useLang } from "../../i18n";

interface Props {
  retrievers: readonly PluginChoice[];
  onChange: (next: PluginChoice[]) => void;
}

/** The chain of services that tell the address: the first is the main one, the rest are tried when it fails. */
export function RetrieverSection({ retrievers, onChange }: Props) {
  const lang = useLang();
  const used = new Set(retrievers.map((r) => r.type));
  const available = featured.retriever.filter((name) => !used.has(name));
  const [pick, setPick] = useState("");
  // The select may still hold a service that has just been added.
  const next = available.includes(pick as never) ? pick : (available[0] ?? "");

  const move = (from: number, to: number) => {
    const list = [...retrievers];
    const [item] = list.splice(from, 1);
    if (item) list.splice(to, 0, item);
    onChange(list);
  };

  return (
    <>
      <p>{t("addressText")}</p>
      <ol class="chain">
        {retrievers.map((r, i) => {
          const info = pluginInfo("retriever", r.type);
          return (
            <li key={r.type}>
              <span class="badge">
                {i === 0
                  ? t("retrieverPrimary")
                  : t("retrieverBackup", { n: String(i) })}
              </span>
              <span class="grow">
                <strong>{info?.title[lang] ?? r.type}</strong>
                <span class="hint">{info?.summary[lang]}</span>
              </span>
              <button
                type="button"
                disabled={i === 0}
                aria-label={`${t("moveUp")}: ${info?.title[lang] ?? r.type}`}
                onClick={() => move(i, i - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === retrievers.length - 1}
                aria-label={`${t("moveDown")}: ${info?.title[lang] ?? r.type}`}
                onClick={() => move(i, i + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                disabled={retrievers.length === 1}
                aria-label={`${t("remove")}: ${info?.title[lang] ?? r.type}`}
                onClick={() => onChange(retrievers.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ol>
      {available.length > 0 && (
        <div class="add-row">
          <select
            aria-label={t("addBackup")}
            value={next}
            onChange={(e) => setPick(e.currentTarget.value)}
          >
            {available.map((name) => (
              <option key={name} value={name}>
                {pluginInfo("retriever", name)?.title[lang] ?? name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              onChange([...retrievers, { type: next, values: {} }])
            }
          >
            {t("addBackup")}
          </button>
        </div>
      )}
    </>
  );
}
