import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/states";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-8 h-8 w-48" />
      <ListSkeleton rows={4} />
    </div>
  );
}
