import { useTranslation } from "@/hooks/useTranslation";
import type { GroupBuilderProps } from "@/types/host";

export default function ToothChartBuilder({
  question,
  onChange,
}: GroupBuilderProps) {
  const { t } = useTranslation();
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={!!question.required}
        onChange={(event) =>
          onChange({
            required: event.target.checked,
          })
        }
      />
      {t("require_tooth_selection")}
    </label>
  );
}
