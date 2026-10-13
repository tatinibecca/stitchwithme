import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-body-small font-semibold [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-surface text-foreground",
        outline: "border border-input text-foreground",
        paid: "bg-status-paid-bg text-status-paid-fg",
        due: "bg-status-due-bg text-status-due-fg",
        overdue: "bg-status-overdue-bg text-status-overdue-fg",
        info: "bg-status-info-bg text-status-info-fg",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
