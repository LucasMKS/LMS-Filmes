import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: string, comment?: string) => Promise<void>;
  itemTitle: string;
  itemType: "filme" | "série";
  itemId: string | number;
  currentRating?: {
    myVote: string;
    comment?: string;
  } | null;
}

export function RatingDialog({
  isOpen,
  onClose,
  onSubmit,
  itemTitle,
  itemType,
  itemId,
  currentRating,
}: RatingDialogProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar avaliação atual quando o diálogo abrir
  useEffect(() => {
    if (isOpen && currentRating) {
      setSelectedRating(parseFloat(currentRating.myVote) || 0);
      setComment(currentRating.comment || "");
    } else if (isOpen) {
      setSelectedRating(0);
      setComment("");
    }
  }, [isOpen, currentRating]);

  const handleSubmit = async () => {
    if (selectedRating <= 0 || selectedRating > 10) {
      toast.error("Erro", {
        description: "Por favor, selecione uma avaliação válida entre 0.5 e 10",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedRating.toString(), comment.trim() || undefined);
      toast.success("Avaliação enviada!", {
        description: `Sua avaliação do ${itemType} "${itemTitle}" foi registrada com sucesso.`,
      });

      setSelectedRating(0);
      setComment("");
      onClose();
    } catch (error: any) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error("Erro ao avaliar", {
        description: `Não foi possível registrar sua avaliação do ${itemType}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedRating(0);
    setComment("");
    onClose();
  };

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const getRatingDescription = (rating: number): string => {
    if (rating >= 10) return "Obra-prima";
    if (rating >= 9) return "Excelente";
    if (rating >= 8) return "Muito bom";
    if (rating >= 7) return "Bom";
    if (rating >= 6) return "Legal";
    if (rating >= 5) return "Regular";
    if (rating >= 4) return "Fraco";
    if (rating >= 3) return "Ruim";
    if (rating >= 2) return "Muito ruim";
    if (rating > 0) return "Péssimo";
    return "";
  };

  const StarRating = () => {
    const displayRating = hoverRating || selectedRating;

    return (
      <div className="space-y-4">
        <div
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
          onMouseLeave={handleStarLeave}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
            const isFilled = displayRating >= star;
            const isHalfFilled =
              displayRating >= star - 0.5 && displayRating < star;

            return (
              <div
                key={star}
                className="relative cursor-pointer select-none touch-manipulation"
              >
                {/* Estrela de fundo */}
                <Star className="w-7 h-7 sm:w-8 sm:h-8 text-slate-700 transition-all duration-200" />

                {/* Estrela cheia ou meia */}
                {(isFilled || isHalfFilled) && (
                  <Star
                    className={cn(
                      "absolute top-0 left-0 w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 fill-current transition-all duration-200 pointer-events-none drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]",
                      isHalfFilled ? "clip-path-half" : "",
                    )}
                    style={isHalfFilled ? { clipPath: "inset(0 50% 0 0)" } : {}}
                  />
                )}

                {/* Área de hover para meia estrela (lado esquerdo - exatos 50% da largura) */}
                <div
                  className="absolute top-0 left-0 w-[50%] h-full cursor-pointer z-10"
                  onMouseEnter={() => handleStarHover(star - 0.5)}
                  onClick={() => handleStarClick(star - 0.5)}
                />
                {/* Área de hover para estrela completa (lado direito - exatos 50% da largura) */}
                <div
                  className="absolute top-0 right-0 w-[50%] h-full cursor-pointer z-10"
                  onMouseEnter={() => handleStarHover(star)}
                  onClick={() => handleStarClick(star)}
                />
              </div>
            );
          })}
        </div>

        <div className="text-center bg-slate-900/50 py-3 rounded-xl border border-slate-800/50">
          <div className="text-3xl font-extrabold text-yellow-400 leading-none mb-1">
            {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
          </div>
          <div className="text-sm font-medium h-5 text-slate-300">
            {displayRating > 0
              ? getRatingDescription(displayRating)
              : "Selecione uma nota"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md p-5 sm:p-6 bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl sm:rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-slate-50 text-xl font-bold text-center sm:text-left">
            {currentRating ? "Editar Avaliação" : "Avaliar"}
          </DialogTitle>
          <p className="text-slate-400 text-sm font-medium mt-1 text-center sm:text-left line-clamp-1">
            {itemTitle}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating com estrelas */}
          <div className="space-y-3">
            <StarRating />
          </div>

          {/* Comentário opcional */}
          <div className="space-y-2">
            <Label className="text-slate-300 font-medium ml-1">
              Comentário (opcional)
            </Label>
            <Textarea
              placeholder={`O que você achou d${
                itemType === "filme" ? "este filme" : "esta série"
              }?`}
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setComment(e.target.value)
              }
              className="bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-xl p-3"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all rounded-xl h-11"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedRating <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 transition-all shadow-lg rounded-xl h-11"
            >
              {isSubmitting
                ? "Enviando..."
                : currentRating
                  ? "Atualizar Nota"
                  : "Salvar Avaliação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
