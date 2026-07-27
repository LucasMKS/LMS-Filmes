"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderPlus,
  Check,
  Plus,
  Film,
  Tv,
  ListFilter,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getUserLists,
  fetchUserLists,
  createCustomList,
  addItemToCustomList,
  removeItemFromCustomList,
  isItemInList,
  useListsListener,
  CustomList,
} from "@/lib/userLists";
import AuthService from "@/lib/auth";
import Image from "next/image";

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string | number;
    type: "movie" | "serie";
    title: string;
    posterPath: string | null;
    backdropPath?: string | null;
    voteAverage?: number;
    releaseYear?: string;
  };
  userEmail?: string;
}

export function AddToListModal({
  isOpen,
  onClose,
  item,
  userEmail,
}: AddToListModalProps) {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const effectiveEmail = userEmail || AuthService.getUser()?.email;
  const itemIdStr = String(item.id);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchUserLists(effectiveEmail).then((res) => {
        setLists(res);
        setIsLoading(false);
      });
      setIsCreating(false);
      setNewListName("");
      setNewListDesc("");
    }
  }, [isOpen, effectiveEmail]);

  useEffect(() => {
    if (!isOpen) return;
    const cleanup = useListsListener(() => {
      setLists(getUserLists(effectiveEmail));
    });
    return cleanup;
  }, [isOpen, effectiveEmail]);

  const handleToggleList = async (list: CustomList) => {
    const inList = isItemInList(list.id, itemIdStr, item.type, effectiveEmail);

    if (inList) {
      await removeItemFromCustomList(list.id, itemIdStr, item.type, effectiveEmail);
      toast.success(`Removido de "${list.name}"`);
    } else {
      await addItemToCustomList(
        list.id,
        {
          id: itemIdStr,
          type: item.type,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          voteAverage: item.voteAverage,
          releaseYear: item.releaseYear,
        },
        effectiveEmail
      );
      toast.success(`Adicionado a "${list.name}"`);
    }

    setLists(getUserLists(effectiveEmail));
  };

  const handleCreateNewList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) {
      toast.error("Por favor, digite um nome para a lista");
      return;
    }

    const newList = await createCustomList(newListName.trim(), newListDesc.trim(), effectiveEmail);
    if (newList) {
      await addItemToCustomList(
        newList.id,
        {
          id: itemIdStr,
          type: item.type,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          voteAverage: item.voteAverage,
          releaseYear: item.releaseYear,
        },
        effectiveEmail
      );

      toast.success(`Lista "${newList.name}" criada e item adicionado!`);
    }
    setLists(getUserLists(effectiveEmail));
    setNewListName("");
    setNewListDesc("");
    setIsCreating(false);
  };

  const posterUrl = item.posterPath
    ? item.posterPath.startsWith("http")
      ? item.posterPath
      : `https://image.tmdb.org/t/p/w200${item.posterPath}`
    : "/placeholder-movie.jpg";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0f0f15] border border-white/10 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
              <Image
                src={posterUrl}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-400" />
                Adicionar às Listas
              </DialogTitle>
              <p className="text-xs text-white/50 line-clamp-1 mt-0.5 font-medium">
                {item.type === "movie" ? "Filme" : "Série"}:{" "}
                <span className="text-white/80">{item.title}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Form para criar nova lista */}
          {isCreating ? (
            <form
              onSubmit={handleCreateNewList}
              className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Nova Lista Personalizada
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-white/40 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <Input
                placeholder="Nome da lista (ex: Favoritos de Ação, Para Maratonar...)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl focus:border-purple-500"
                autoFocus
              />

              <Input
                placeholder="Descrição (opcional)"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl focus:border-purple-500"
              />

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold px-4"
                >
                  Criar e Adicionar
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-xs font-semibold transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              Criar Nova Lista
            </button>
          )}

          {/* Listas existentes */}
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {lists.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs">
                Você ainda não criou nenhuma lista personalizada.
              </div>
            ) : (
              lists.map((list) => {
                const inList = isItemInList(
                  list.id,
                  itemIdStr,
                  item.type,
                  effectiveEmail
                );
                return (
                  <div
                    key={list.id}
                    onClick={() => handleToggleList(list)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 select-none",
                      inList
                        ? "bg-purple-500/15 border-purple-500/40 text-white"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-white/70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                          inList
                            ? "bg-purple-600 text-white"
                            : "bg-white/5 text-white/40"
                        )}
                      >
                        <ListFilter className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">
                          {list.name}
                        </p>
                        <p className="text-[11px] text-white/40 font-medium">
                          {list.items.length}{" "}
                          {list.items.length === 1 ? "item" : "itens"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                        inList
                          ? "bg-purple-500 border-purple-400 text-white"
                          : "border-white/20 bg-transparent"
                      )}
                    >
                      {inList && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-xs"
          >
            Concluído
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
