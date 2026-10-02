import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";

interface Props {
  title: string;
  /** What is chosen in the block, shown next to the title so a folded block still says something. */
  info?: string;
  /** What is still missing; shown in the title row, folded or not. */
  warn?: string;
  defaultOpen?: boolean;
  children: ComponentChildren;
}

/**
 * A block of the constructor that can be folded. The open state lives here, so
 * what happens inside (a notifier unticked, a field emptied) never closes it.
 */
export function Step({
  title,
  info,
  warn,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      class="step"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <span class="step-title">{title}</span>
        {info && <span class="step-info">{info}</span>}
        {warn && <span class="step-warn">{warn}</span>}
      </summary>
      <div class="step-body">{children}</div>
    </details>
  );
}
