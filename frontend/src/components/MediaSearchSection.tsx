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
      className={`${cardClassName} bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950`}
    >
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-white flex items-center space-x-2 text-lg sm:text-xl">
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
              className="bg-slate-700/30 !border-slate-600 placeholder:text-slate-400 pr-10"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={onSearch}
            disabled={!searchQuery.trim() || isSearching}
            className={`${searchButtonClassName} disabled:opacity-50`}
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
            <span className="text-sm text-slate-400 font-medium hidden sm:inline">
              {categoryLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  variant={categoryFilter === id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onCategoryChange(id)}
                  className={
                    categoryFilter === id
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </Button>
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
                  ? "bg-green-500/10 text-green-400 border-0"
                  : "bg-blue-500/10 text-blue-400 border-0"
              }
            >
              {isSearchMode ? (
                <Search className="w-3 h-3 mr-1" />
              ) : (
                <currentCategoryInfo.Icon className="w-3 h-3 mr-1" />
              )}
              {isSearchMode ? "Resultados da Busca" : currentCategoryInfo.label}
            </Badge>
            <span className="text-slate-400 text-sm">
              {currentCount} {resultLabel}
            </span>
            {isSearchMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSearch}
                className="text-slate-400 hover:text-slate-300 px-2 py-1 h-6"
              >
                <X className="w-3 h-3 mr-1" /> Limpar busca
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
