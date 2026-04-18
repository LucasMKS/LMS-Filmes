import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X, type LucideIcon } from "lucide-react";

type MediaCategoryItem<C extends string> = {
  id: C;
  label: string;
  Icon: LucideIcon;
};

interface MediaSearchSectionProps<C extends string> {
  title: string;
  titleIconColorClassName: string;
  searchButtonClassName: string;
  searchPlaceholder: string;
  resultLabel: string;
  categoryLabel?: string;
  cardClassName?: string;
  searchQuery: string;
  isSearching: boolean;
  isSearchMode: boolean;
  currentCount: number;
  categoryFilter: C;
  categories: MediaCategoryItem<C>[];
  onSearch: () => void;
  onClearSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onCategoryChange: (category: C) => void;
}

export function MediaSearchSection<C extends string>({
  title,
  titleIconColorClassName,
  searchButtonClassName,
  searchPlaceholder,
  resultLabel,
  categoryLabel = "Categoria:",
  cardClassName = "mb-6 sm:mb-8",
  searchQuery,
  isSearching,
  isSearchMode,
  currentCount,
  categoryFilter,
  categories,
  onSearch,
  onClearSearch,
  onSearchQueryChange,
  onCategoryChange,
}: MediaSearchSectionProps<C>) {
  const currentCategoryInfo =
    categories.find((c) => c.id === categoryFilter) || categories[0];

  return (
    <Card
      className={`${cardClassName} bg-[#14141c] !border-white/[0.06] border shadow-xl shadow-black/30`}
    >
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-white flex items-center space-x-2 text-lg sm:text-xl font-bold">
          <Search
            className={`w-4 h-4 sm:w-5 sm:h-5 ${titleIconColorClassName}`}
          />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 relative">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="bg-[#0a0a0f]/60 !border-white/10 placeholder:text-white/25 text-white/80 focus:!border-purple-500/40 pr-10 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={onSearch}
            disabled={!searchQuery.trim() || isSearching}
            className={`${searchButtonClassName} disabled:opacity-50 rounded-xl`}
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {!isSearchMode && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-white/30 font-medium hidden sm:inline">
              {categoryLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => onCategoryChange(id)}
                  className={
                    categoryFilter === id
                      ? "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25 transition-all"
                      : "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/35 hover:text-white/70 hover:bg-white/5 border border-transparent transition-all"
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge
              variant="secondary"
              className={
                isSearchMode
                  ? "bg-emerald-500/10 text-emerald-400 border-0 rounded-xl"
                  : "bg-purple-500/10 text-purple-400 border-0 rounded-xl"
              }
            >
              {isSearchMode ? (
                <Search className="w-3 h-3 mr-1" />
              ) : (
                <currentCategoryInfo.Icon className="w-3 h-3 mr-1" />
              )}
              {isSearchMode ? "Resultados da Busca" : currentCategoryInfo.label}
            </Badge>
            <span className="text-white/30 text-sm">
              {currentCount} {resultLabel}
            </span>
            {isSearchMode && (
              <button
                onClick={onClearSearch}
                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
