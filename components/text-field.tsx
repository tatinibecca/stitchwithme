import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
};

/** Campo com label explícito; dica e erro ligados ao input por aria-describedby. */
export function TextField({ label, hint, error, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      {hint && (
        <p id={hintId} className="text-body text-muted-foreground">
          {hint}
        </p>
      )}
      <Input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-body font-medium text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
