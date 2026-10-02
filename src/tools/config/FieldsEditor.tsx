import { fileSecrets, hiddenFields, pluginInfo } from "../../content/plugins";
import type { Field, Kind, Plugin } from "../../core/schema";
import { envName, secretFileName } from "../../core/toml";
import { t, useLang } from "../../i18n";

interface Props {
  kind: Kind;
  plugin: Plugin;
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

/** Form for the fields of one plugin: the required ones, then the optional ones folded away. */
export function FieldsEditor({ kind, plugin, values, onChange }: Props) {
  const lang = useLang();
  const info = pluginInfo(kind, plugin.name);
  const fields = plugin.fields.filter((f) => !hiddenFields.has(f.name));
  const main = fields.filter((f) => f.required);
  const more = fields.filter((f) => !f.required);

  const render = (f: Field) => {
    const finfo = info?.fields[f.name];
    const label = finfo?.label[lang] ?? f.name;
    const id = `f-${kind}-${plugin.name}-${f.name}`;
    const hint = finfo?.where && <p class="hint">{finfo.where[lang]}</p>;

    if (f.secret) {
      const note = fileSecrets.has(`${plugin.name}.${f.name}`)
        ? t("secretFile", { name: secretFileName(plugin.name, f.name) })
        : t("secretField", { name: envName(plugin.name, f.name) });
      return (
        <div class="field" key={f.name}>
          <span class="label">{label}</span>
          {hint}
          <p class="secret">{note}</p>
        </div>
      );
    }

    const value = values[f.name] ?? "";
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
              onChange(f.name, e.currentTarget.checked ? "true" : "")
            }
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            placeholder={finfo?.example ?? f.example ?? f.default ?? ""}
            onInput={(e) => onChange(f.name, e.currentTarget.value)}
          />
        )}
        {hint}
      </div>
    );
  };

  return (
    <>
      {main.map(render)}
      {more.length > 0 && (
        <details>
          <summary>{t("moreOptions")}</summary>
          {more.map(render)}
        </details>
      )}
    </>
  );
}
