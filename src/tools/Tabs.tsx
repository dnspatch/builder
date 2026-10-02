import type { ComponentChildren } from "preact";

export interface Tab {
  id: string;
  label: string;
  content: ComponentChildren;
}

/**
 * Tabs over one place: the labels in a row, the chosen one's content below. The
 * choice is held by the caller, so several tab lists can follow one choice;
 * `name` keeps their element ids apart.
 */
export function Tabs({
  name,
  tabs,
  value,
  onChange,
}: {
  name: string;
  tabs: readonly Tab[];
  value: string;
  onChange: (id: string) => void;
}) {
  const tabId = (id: string) => `tab-${name}-${id}`;

  // Arrow keys move between the tabs, as in a tab list of a native app.
  const move = (from: number, step: number) => {
    const next = tabs[(from + step + tabs.length) % tabs.length];
    if (!next) return;
    onChange(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  return (
    <div class="tabs">
      <div class="tablist" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            aria-selected={value === tab.id}
            aria-controls={`panel-${name}-${tab.id}`}
            tabIndex={value === tab.id ? 0 : -1}
            class={value === tab.id ? "tab on" : "tab"}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(i, 1);
              else if (e.key === "ArrowLeft") move(i, -1);
              else return;
              e.preventDefault();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${name}-${tab.id}`}
          aria-labelledby={tabId(tab.id)}
          hidden={value !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
