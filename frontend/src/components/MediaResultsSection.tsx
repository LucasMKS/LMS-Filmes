import { Button } from "@/components/ui/button";
import { Clock, type LucideIcon } from "lucide-react";

interface MediaResultsSectionProps<T extends { id: number }> {
  items: T[];
  isSearchMode: boolean;
  searchResultsLength: number;
  isSearching: boolean;
  searchQuery: string;
  loadingMore: boolean;
  onLoadMore: () => void;
  onClearSearch: () => void;
  emptyTitle: string;
  emptyDescriptionPrefix: string;
  emptyBackButtonLabel: string;
  emptyIcon: LucideIcon;
  renderCard: (item: T) => React.ReactNode;
}

export function MediaResultsSection<T extends { id: number }>({
  items,
  isSearchMode,
  searchResultsLength,
  isSearching,
  searchQuery,
  loadingMore,
  onLoadMore,
  onClearSearch,
  emptyTitle,
  emptyDescriptionPrefix,
  emptyBackButtonLabel,
  emptyIcon: EmptyIcon,
  renderCard,
}: MediaResultsSectionProps<T>) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {items.map((item) => renderCard(item))}
      </div>

      {isSearchMode && searchResultsLength === 0 && !isSearching && (
        <div className="text-center py-12">
          <div className="bg-[#14141c]/80 backdrop-blur-sm rounded-2xl p-8 border border-white/[0.06]">
            <EmptyIcon className="w-14 h-14 text-white/20 mx-auto mb-4" />
            <h3 className="text-white/60 text-lg font-semibold mb-2">
              {emptyTitle}
            </h3>
            <p className="text-white/30 mb-5 text-sm">
              {emptyDescriptionPrefix} "{searchQuery}".
            </p>
            <button
              onClick={onClearSearch}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm font-medium transition-all"
            >
              {emptyBackButtonLabel}
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#14141c] border border-white/[0.06] text-white/50 hover:text-white/80 hover:bg-[#1a1a26] hover:border-purple-500/20 disabled:opacity-40 text-sm font-medium transition-all duration-200"
        >
          {loadingMore ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/40"></div>
              Carregando...
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              Carregar Mais
            </>
          )}
        </button>
      </div>
    </>
  );
}
