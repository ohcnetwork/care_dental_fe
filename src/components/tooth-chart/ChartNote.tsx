import { NotebookPen, X } from "lucide-react";
import { useId, useState } from "react";

import { useTranslation } from "@/hooks/useTranslation";

interface ChartNoteProps {
  note: string | undefined;
  readOnly: boolean;
  onChange: (note: string | undefined) => void;
}

/** The question-level note, inline: the host draws no note affordance for
 *  structured questions, and a chart often needs one line of context
 *  ("generalised recession", "patient declined radiograph"). */
export function ChartNote({ note, readOnly, onChange }: ChartNoteProps) {
  const { t } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(!!note);
  const showField = open || !!note;

  if (readOnly) {
    return note ? (
      <p className="text-xs whitespace-pre-wrap text-gray-700">
        <span className="font-medium text-gray-500">{t("note")}: </span>
        {note}
      </p>
    ) : null;
  }

  if (!showField) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-500 hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)] focus-visible:outline-none"
      >
        <NotebookPen aria-hidden="true" className="size-3.5" />
        {t("add_note")}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-gray-600">
          {t("note")}
        </label>
        <button
          type="button"
          aria-label={t("clear_note")}
          onClick={() => {
            setOpen(false);
            onChange(undefined);
          }}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      <textarea
        id={id}
        value={note ?? ""}
        rows={2}
        placeholder={t("note_placeholder")}
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : event.target.value)
        }
        className="w-full resize-y rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)]"
      />
    </div>
  );
}
