import { pingEnv } from "../../core/toml";
import { t } from "../../i18n";

interface Props {
  ping: boolean;
  /** The release has the ping only in the -full image. */
  needsFull: boolean;
  onChange: (next: boolean) => void;
}

/** Optional block: a monitoring service that raises the alarm when dnspatch stops reporting. */
export function MonitorSection({ ping, needsFull, onChange }: Props) {
  return (
    <>
      <p>{t("monitorIntro")}</p>
      <label class="check">
        <input
          type="checkbox"
          checked={ping}
          onChange={(e) => onChange(e.currentTarget.checked)}
        />
        <strong>{t("monitorUse")}</strong>
      </label>
      {ping && (
        <div class="indent">
          <p class="hint">{t("monitorWhere")}</p>
          <p class="secret">{t("secretField", { name: pingEnv })}</p>
          {needsFull && <p class="hint">{t("monitorFull")}</p>}
        </div>
      )}
    </>
  );
}
