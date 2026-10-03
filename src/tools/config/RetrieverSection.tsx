import { useState } from "preact/hooks";
import { featured, pluginInfo } from "../../content/plugins";
import type { PluginChoice } from "../../core/toml";
import { t, useLang } from "../../i18n";
import { MissingPlugin } from "./MissingPlugin";

interface Props {
  retrievers: readonly PluginChoice[];
  onChange: (next: PluginChoice[]) => void;
}

/**
 * The chain of services that tell the address: the first is the main one, the
 * rest are tried when it fails. The order is changed by dragging a row, or with
 * the arrows, which also serve the keyboard and touch screens.
 */
export function RetrieverSection({ retrievers, onChange }: Props) {
  const lang = useLang();
  const used = new Set(retrievers.map((r) => r.type));
  const available = featured.retriever.filter((name) => !used.has(name));
  const [pick, setPick] = useState("");
  // The select may still hold a service that has just been added.
  const next = available.includes(pick as never) ? pick : (available[0] ?? "");

  const [dragged, setDragged] = useState<number>();
  const [over, setOver] = useState<number>();

  const move = (from: number, to: number) => {
    if (from === to) return;
    const list = [...retrievers];
    const [item] = list.splice(from, 1);
    if (item) list.splice(to, 0, item);
    onChange(list);
  };

  const endDrag = () => {
    setDragged(undefined);
    setOver(undefined);
  };

  return (
    <>
      <p>{t("addressText")}</p>
      <p class="hint">{t("dragHint")}</p>
      <ol class="chain">
        {retrievers.map((r, i) => {
          const info = pluginInfo("retriever", r.type);
          const name = info?.title[lang] ?? r.type;
          const classes = [
            dragged === i ? "dragging" : "",
            over === i && dragged !== undefined && dragged !== i
              ? "drop-target"
              : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li
              key={r.type}
              class={classes}
              draggable
              onDragStart={(e) => {
                setDragged(i);
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = "move";
                  // Firefox starts a drag only when some data is set.
                  e.dataTransfer.setData("text/plain", r.type);
                }
              }}
              onDragOver={(e) => {
                if (dragged === undefined) return;
                e.preventDefault();
                if (over !== i) setOver(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragged !== undefined) move(dragged, i);
                endDrag();
              }}
              onDragEnd={endDrag}
            >
              <span class="handle" aria-hidden="true">
                ⋮⋮
              </span>
              <span class="badge">
                {i === 0
                  ? t("retrieverPrimary")
                  : t("retrieverBackup", { n: String(i) })}
              </span>
              <span class="grow">
                <strong>{name}</strong>
                <span class="hint">{info?.summary[lang]}</span>
              </span>
              <button
                type="button"
                disabled={i === 0}
                aria-label={`${t("moveUp")}: ${name}`}
                onClick={() => move(i, i - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === retrievers.length - 1}
                aria-label={`${t("moveDown")}: ${name}`}
                onClick={() => move(i, i + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                disabled={retrievers.length === 1}
                aria-label={`${t("remove")}: ${name}`}
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
      <MissingPlugin kind="retriever" />
    </>
  );
}
