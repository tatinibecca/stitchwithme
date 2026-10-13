import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-touch w-full min-w-0 rounded-md border border-input bg-card px-4 text-body-large text-foreground transition-colors duration-150 placeholder:text-muted-foreground",
        "focus-visible:border-2 focus-visible:border-ring focus-visible:px-[15px]",
        "aria-invalid:border-2 aria-invalid:border-destructive aria-invalid:px-[15px]",
        "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
