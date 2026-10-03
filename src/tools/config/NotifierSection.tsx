import { events } from "../../content/extras";
import { featured, pluginInfo } from "../../content/plugins";
import type { Schema } from "../../core/schema";
import { findPlugin } from "../../core/schema";
import { eventTypes, type NotifierChoice } from "../../core/toml";
import { t, useLang } from "../../i18n";
import { FieldsEditor } from "./FieldsEditor";
import { MissingPlugin } from "./MissingPlugin";

interface Props {
  schema: Schema;
  notifiers: readonly NotifierChoice[];
  onChange: (next: NotifierChoice[]) => void;
}

/** Optional block: which message brokers get the events. One notifier per type. */
export function NotifierSection({ schema, notifiers, onChange }: Props) {
  const lang = useLang();

  const update = (type: string, patch: Partial<NotifierChoice>) =>
    onChange(notifiers.map((n) => (n.type === type ? { ...n, ...patch } : n)));

  return (
    <>
      <p>{t("notifyIntro")}</p>
      {featured.notifier.map((name) => {
        const plugin = findPlugin(schema, "notifier", name);
        if (!plugin) return null;
        const info = pluginInfo("notifier", name);
        const current = notifiers.find((n) => n.type === name);
        const title = info?.title[lang] ?? name;
        return (
          <div class="notifier" key={name}>
            <label class="check">
              <input
                type="checkbox"
                checked={current !== undefined}
                onChange={(e) =>
                  onChange(
                    e.currentTarget.checked
                      ? [
                          ...notifiers,
                          { type: name, values: {}, events: ["status"] },
                        ]
                      : notifiers.filter((n) => n.type !== name),
                  )
                }
              />
              <span>
                <strong>{t("notifyUse", { name: title })}</strong>
                <span class="hint"> {info?.summary[lang]}</span>
              </span>
            </label>
            {current && (
              <div class="indent">
                <FieldsEditor
                  kind="notifier"
                  plugin={plugin}
                  values={current.values}
                  onChange={(field, value) =>
                    update(name, {
                      values: { ...current.values, [field]: value },
                    })
                  }
                />
                <fieldset>
                  <legend>{t("notifyEvents")}</legend>
                  {eventTypes.map((ev) => (
                    <label class="check event" key={ev}>
                      <input
                        type="checkbox"
                        checked={current.events.includes(ev)}
                        onChange={(e) =>
                          update(name, {
                            events: e.currentTarget.checked
                              ? [...current.events, ev]
                              : current.events.filter((x) => x !== ev),
                          })
                        }
                      />
                      <span>
                        {events[ev]?.title[lang] ?? ev}
                        <span class="hint"> {events[ev]?.hint[lang]}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
            )}
          </div>
        );
      })}
      {notifiers.length > 0 && <p class="hint">{t("notifyFull")}</p>}
      <MissingPlugin kind="notifier" />
    </>
  );
}
