import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { t } from "../i18n";

function Icon({
  label,
  children,
}: {
  label: string;
  children: ComponentChildren;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <title>{label}</title>
      {children}
    </svg>
  );
}

/** A text file or command; copy and download icons appear over it on hover. */
export function CodeBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; the text is still selectable.
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = title;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLabel = copied ? t("copied") : t("copy");

  return (
    <div class="code">
      {title && <div class="code-head">{title}</div>}
      <div class="code-body">
        <pre>{text}</pre>
        <span class="actions">
          <button
            type="button"
            class={copied ? "icon-btn done" : "icon-btn"}
            aria-label={copyLabel}
            onClick={copy}
          >
            <Icon label={copyLabel}>
              {copied ? (
                <path d="M20 6 9 17l-5-5" />
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
              )}
            </Icon>
          </button>
          {title && (
            <button
              type="button"
              class="icon-btn"
              aria-label={t("download")}
              onClick={download}
            >
              <Icon label={t("download")}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </Icon>
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
