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
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
            <EmptyIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-300 text-lg font-medium mb-2">
              {emptyTitle}
            </h3>
            <p className="text-slate-400 mb-4">
              {emptyDescriptionPrefix} "{searchQuery}".
            </p>
            <Button
              onClick={onClearSearch}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {emptyBackButtonLabel}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Button
          onClick={onLoadMore}
          disabled={loadingMore}
          size="lg"
          variant="outline"
          className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white disabled:opacity-50"
        >
          {loadingMore ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mr-2"></div>
              <span>Carregando...</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              <span>Carregar Mais</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
