export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8 flex flex-col gap-1">
      <h1 className="text-card-title md:text-section-title">{title}</h1>
      {description && <p className="text-body-large text-muted-foreground">{description}</p>}
    </header>
  );
}
