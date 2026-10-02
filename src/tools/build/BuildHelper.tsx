import { useEffect, useRef, useState } from "preact/hooks";
import {
  binaryName,
  buildCommand,
  defaultPlatform,
  findPlatform,
  platforms,
  prepareCommand,
  type Shell,
} from "../../core/platforms";
import { type Key, t, useLang } from "../../i18n";
import { CodeBlock } from "../CodeBlock";
import { Tabs } from "../Tabs";

const shells: { id: Shell; label: Key }[] = [
  { id: "posix", label: "shellPosix" },
  { id: "powershell", label: "shellPowershell" },
  { id: "cmd", label: "shellCmd" },
];

/** A button that opens a window with the steps to build dnspatch for another device. */
export function BuildHelper({
  tags,
  version,
}: {
  tags: string;
  version: string;
}) {
  const lang = useLang();
  const dialog = useRef<HTMLDialogElement>(null);
  const [platformId, setPlatformId] = useState(defaultPlatform.id);
  const [noGo, setNoGo] = useState(false);
  const platform = findPlatform(platformId);
  // The terminal is chosen once for both steps; Windows opens with PowerShell.
  const [shell, setShell] = useState<Shell>(
    navigator.userAgent.includes("Windows") ? "powershell" : "posix",
  );
  const shellTabs = (command: (shell: Shell) => string) =>
    shells.map(({ id, label }) => ({
      id,
      label: t(label),
      content: <CodeBlock title="" text={command(id)} />,
    }));

  // A click on the dimmed area around the window closes it; Esc works natively.
  useEffect(() => {
    const el = dialog.current;
    const onClick = (e: MouseEvent) => {
      if (e.target === el) el?.close();
    };
    el?.addEventListener("click", onClick);
    return () => el?.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <button
        type="button"
        class="primary"
        onClick={() => dialog.current?.showModal()}
      >
        {t("helpMeBuild")}
      </button>

      <dialog ref={dialog} class="modal" aria-labelledby="helper-title">
        <div class="modal-head">
          <h2 id="helper-title">{t("helpMeBuild")}</h2>
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => dialog.current?.close()}
          >
            ✕
          </button>
        </div>

        <p>
          {t("tagsLabel")}: <code>{tags}</code>
        </p>
        <label class="label" for="platform">
          {t("platformLabel")}
        </label>
        <select
          id="platform"
          value={platformId}
          onChange={(e) => setPlatformId(e.currentTarget.value)}
        >
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title[lang]}
            </option>
          ))}
        </select>
        <p class="hint">{platform.hint[lang]}</p>
        <p class="hint">{t("platformHelp")}</p>

        <div class="cards two" role="radiogroup" aria-label={t("goQuestion")}>
          {[false, true].map((without) => (
            <label
              class={noGo === without ? "card selected" : "card"}
              key={String(without)}
            >
              <input
                type="radio"
                name="go"
                checked={noGo === without}
                onChange={() => setNoGo(without)}
              />
              <strong>{t(without ? "noGo" : "hasGo")}</strong>
              <span>{t(without ? "noGoSummary" : "hasGoSummary")}</span>
            </label>
          ))}
        </div>
        {noGo ? (
          <div class="callout">
            <strong>{t("noGoTitle")}</strong>
            <ol>
              <li>
                <a
                  href="https://go.dev/dl/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("noGoStep1")} (go.dev/dl)
                </a>
                {t("noGoStep1Rest")}
              </li>
              <li>{t("noGoStep2")}</li>
              <li>{t("noGoStep3")}</li>
            </ol>
          </div>
        ) : null}

        <h4>{t("buildStepPrepare")}</h4>
        <Tabs
          name="prepare"
          tabs={shellTabs((s) => prepareCommand(version, noGo, s))}
          value={shell}
          onChange={(id) => setShell(id as Shell)}
        />
        <h4>{t("buildStepBuild")}</h4>
        <Tabs
          name="build"
          tabs={shellTabs((s) => buildCommand(platform, tags, s, noGo))}
          value={shell}
          onChange={(id) => setShell(id as Shell)}
        />
        <h4>{t("buildStepMove")}</h4>
        <p>{t("buildMove", { file: binaryName(platform) })}</p>
      </dialog>
    </>
  );
}
