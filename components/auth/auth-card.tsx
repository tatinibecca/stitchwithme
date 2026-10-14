import { Mascot, type MascotPose } from "@/components/brand/mascot";
import { cn } from "@/lib/utils";

export function AuthCard({
  mascot,
  title,
  description,
  children,
  className,
}: {
  mascot?: MascotPose;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="auth-titulo"
      className={cn("flex flex-col gap-6 rounded-lg border bg-card p-6 shadow-elevation-1 md:p-8", className)}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {mascot && <Mascot pose={mascot} size={96} />}
        <h1 id="auth-titulo" className="text-card-title font-extrabold">
          {title}
        </h1>
        {description && <p className="text-body-large text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function FormError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="rounded-sm bg-status-overdue-bg px-4 py-3 text-body font-semibold text-status-overdue-fg">
      {message}
    </p>
  );
}
