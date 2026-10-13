import { Skeleton } from "@/components/ui/skeleton";

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-t py-4">
      <Skeleton className="size-10" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/** Estado de carregamento da Visão do mês: mesma estrutura da tela pronta. */
export function HomeSkeleton() {
  return (
    <div role="status" aria-label="Carregando a visão do mês" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="rounded-md border bg-card px-4 pb-2 lg:col-span-8 lg:px-6">
          <Skeleton className="my-5 h-6 w-56" />
          {Array.from({ length: 6 }, (_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 rounded-md" />
        </div>
      </div>
    </div>
  );
}
