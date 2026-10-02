import { useState } from "preact/hooks";
import { t } from "../i18n";

/** A text file or command with copy and download buttons. */
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

  return (
    <div class="code">
      <div class="code-head">
        <span>{title}</span>
        <span class="actions">
          <button type="button" onClick={copy}>
            {copied ? t("copied") : t("copy")}
          </button>
          {title && (
            <button type="button" onClick={download}>
              {t("download")}
            </button>
          )}
        </span>
      </div>
      <pre>{text}</pre>
    </div>
  );
}
