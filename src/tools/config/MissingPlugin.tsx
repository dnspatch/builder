import { useEffect, useRef, useState } from "preact/hooks";
import { pluginRequestUrl, type RequestKind } from "../../core/issue";
import { type Key, t } from "../../i18n";

/** The texts that differ between the forms; the rest is shared. */
const texts: Record<
  RequestKind,
  {
    title: Key;
    intro: Key;
    service: Key;
    docs: Key;
    extra: Key;
    example: string;
  }
> = {
  provider: {
    title: "noProviderTitle",
    intro: "noProviderIntro",
    service: "noProviderService",
    docs: "noProviderDocs",
    extra: "noProviderAuth",
    example: "Gandi, DuckDNS, …",
  },
  retriever: {
    title: "noRetrieverTitle",
    intro: "noRetrieverIntro",
    service: "noRetrieverService",
    docs: "noRetrieverDocs",
    extra: "noRetrieverDetails",
    example: "api.myip.com, …",
  },
  notifier: {
    title: "noNotifierTitle",
    intro: "noNotifierIntro",
    service: "noNotifierService",
    docs: "noNotifierDocs",
    extra: "noNotifierAuth",
    example: "Matrix, NATS, …",
  },
};

/** A button that opens a form for asking for a service the list lacks. */
export function MissingPlugin({ kind }: { kind: RequestKind }) {
  const text = texts[kind];
  const dialog = useRef<HTMLDialogElement>(null);
  const [service, setService] = useState("");
  const [apiDocs, setApiDocs] = useState("");
  const [why, setWhy] = useState("");
  const [extra, setExtra] = useState("");
  const [willing, setWilling] = useState(false);

  // A click on the dimmed area around the window closes it; Esc works natively.
  useEffect(() => {
    const el = dialog.current;
    const onClick = (e: MouseEvent) => {
      if (e.target === el) el?.close();
    };
    el?.addEventListener("click", onClick);
    return () => el?.removeEventListener("click", onClick);
  }, []);

  const submit = (e: Event) => {
    e.preventDefault();
    const url = pluginRequestUrl(kind, {
      service,
      apiDocs,
      why,
      extra,
      willing,
    });
    window.open(url, "_blank", "noopener");
    dialog.current?.close();
  };

  const id = (field: string) => `mp-${kind}-${field}`;

  return (
    <div class="missing-plugin">
      <button type="button" onClick={() => dialog.current?.showModal()}>
        {t("noPluginButton")}
      </button>

      <dialog
        ref={dialog}
        class="modal narrow"
        aria-labelledby={id("title")}
        data-kind={kind}
      >
        <div class="modal-head">
          <h2 id={id("title")}>{t(text.title)}</h2>
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => dialog.current?.close()}
          >
            ✕
          </button>
        </div>
        <p class="hint">{t(text.intro)}</p>

        <form onSubmit={submit}>
          <label class="label" for={id("service")}>
            {t(text.service)}
          </label>
          <input
            id={id("service")}
            type="text"
            required
            placeholder={text.example}
            value={service}
            onInput={(e) => setService(e.currentTarget.value)}
          />

          <label class="label" for={id("docs")}>
            {t(text.docs)}
          </label>
          <input
            id={id("docs")}
            type="url"
            required
            placeholder="https://"
            value={apiDocs}
            onInput={(e) => setApiDocs(e.currentTarget.value)}
          />

          <label class="label" for={id("why")}>
            {t("noPluginWhy")}
          </label>
          <textarea
            id={id("why")}
            placeholder={t("noPluginWhyHint")}
            required
            value={why}
            onInput={(e) => setWhy(e.currentTarget.value)}
          />

          <label class="label" for={id("extra")}>
            {t(text.extra)}
          </label>
          <textarea
            id={id("extra")}
            value={extra}
            onInput={(e) => setExtra(e.currentTarget.value)}
          />

          <label class="check">
            <input
              type="checkbox"
              checked={willing}
              onChange={(e) => setWilling(e.currentTarget.checked)}
            />
            <span>{t("noPluginWilling")}</span>
          </label>

          <p class="hint">{t("noPluginNote")}</p>
          <button type="submit" class="primary">
            {t("noPluginSubmit")}
          </button>
        </form>
      </dialog>
    </div>
  );
}
