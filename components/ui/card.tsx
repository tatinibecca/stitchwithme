import * as React from "react";
import { cn } from "@/lib/utils";

function Card({
  className,
  interactive = false,
  tone = "default",
  ...props
}: React.ComponentProps<"div"> & {
  interactive?: boolean;
  /** "accent": fundo sálvia para destaques; o texto usa --accent-foreground (5.47:1) */
  tone?: "default" | "accent";
}) {
  return (
    <div
      data-slot="card"
      data-tone={tone}
      className={cn(
        "group/card flex flex-col gap-4 rounded-lg border p-6 shadow-elevation-1",
        tone === "accent"
          ? "border-transparent bg-accent text-accent-foreground"
          : "bg-card text-card-foreground",
        interactive &&
          "transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevation-2 motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 data-slot="card-title" className={cn("font-display text-subtitle font-bold", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p
      data-slot="card-description"
      className={cn("text-body text-muted-foreground group-data-[tone=accent]/card:text-accent-foreground", className)}
      {...props}
    />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-2", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
