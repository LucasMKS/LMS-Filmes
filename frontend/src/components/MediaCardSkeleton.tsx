import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function MediaCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#14141c] transition-all duration-300 h-full flex flex-col"
          )}
        >
          {/* Imagem Placeholder */}
          <div className="relative aspect-[2/3] overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>

          {/* Footer Placeholder */}
          <div className="border-t border-white/[0.05] bg-[#14141c] px-4 py-3.5 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>

          {/* Badge Placeholder */}
          <div className="absolute left-3 top-3 z-20">
            <Skeleton className="h-6 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  )
}
