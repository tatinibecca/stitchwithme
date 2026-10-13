import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm font-sans text-body-large font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Coral, uma por tela. Rótulo escuro para passar no AA (5.21:1). */
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border border-foreground bg-transparent text-foreground hover:bg-surface",
        ghost: "bg-transparent text-foreground underline underline-offset-4 hover:bg-surface",
      },
      size: {
        md: "min-h-touch px-6 py-3",
        lg: "min-h-touch px-8 py-3",
        icon: "size-touch",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
