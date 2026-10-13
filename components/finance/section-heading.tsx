import { cn } from "@/lib/utils";

export function SectionHeading({
  id,
  title,
  description,
  action,
  className,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id={id} className="text-subtitle font-bold md:text-card-title">
          {title}
        </h2>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
