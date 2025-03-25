import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-12 shadow-sm flex flex-col justify-between h-[300px] md:h-[550px] bg-white">
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-12 w-40 mb-4" /> 
        <div className="mt-16 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-3/4" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
