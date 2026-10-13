import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-touch w-full min-w-0 rounded-sm border border-input bg-card px-3 text-body-large text-foreground transition-colors duration-150 placeholder:text-muted-foreground",
        "focus-visible:border-ring",
        "aria-invalid:border-2 aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
