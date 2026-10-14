import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-body font-medium text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Select nativo (melhor no celular e com leitor de tela) com label, dica e erro. */
export function SelectField({
  label,
  hint,
  error,
  children,
  className,
  ...props
}: React.ComponentProps<"select"> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-body font-semibold">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-body text-muted-foreground">
          {hint}
        </p>
      )}
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-touch w-full cursor-pointer appearance-none rounded-md border border-input bg-card bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-10 text-body-large text-foreground",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a8274%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
          "focus-visible:border-ring aria-invalid:border-2 aria-invalid:border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <ErrorText id={errorId!}>{error}</ErrorText>}
    </div>
  );
}

export function CheckboxField({ label, hint, ...props }: Omit<React.ComponentProps<"input">, "type"> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-6 shrink-0 cursor-pointer rounded-xs border border-input accent-[var(--primary)]"
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer font-semibold">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-body text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

/** Escolha única em cartões (fieldset + legend + rádios nativos). */
export function RadioCards<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  columns = 2,
}: {
  legend: string;
  name: string;
  options: { value: T; label: React.ReactNode; description?: string }[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string;
  columns?: 2 | 3;
}) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-body font-semibold">{legend}</legend>
      <div className={cn("grid gap-2", columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex min-h-touch cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors duration-150",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                checked ? "border-2 border-primary bg-accent-soft" : "border-input bg-card hover:bg-surface",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="size-5 shrink-0 cursor-pointer accent-[var(--primary)]"
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{opt.label}</span>
                {opt.description && <span className="text-body text-muted-foreground">{opt.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </fieldset>
  );
}

export function TextAreaField({ label, hint, ...props }: React.ComponentProps<"textarea"> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-body font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-body text-muted-foreground">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-body-large text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
        {...props}
      />
    </div>
  );
}
