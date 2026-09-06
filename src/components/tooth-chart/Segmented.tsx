import { useRef } from "react";

import { cn } from "@/lib/cn";

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  "aria-label": string;
  size?: "sm" | "xs";
}

/** ARIA radiogroup: one tab stop, arrows move the selection. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  disabled,
  "aria-label": ariaLabel,
  size = "sm",
}: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === selectedIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)] focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
              selected
                ? "bg-white text-gray-900 shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-900",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
