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

      // Reset form
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
    if (rating >= 9) return "Obra-prima";
    if (rating >= 8) return "Excelente";
    if (rating >= 7) return "Muito bom";
    if (rating >= 6) return "Bom";
    if (rating >= 5) return "Regular";
    if (rating >= 4) return "Fraco";
    if (rating >= 2) return "Ruim";
    if (rating > 0) return "Muito ruim";
    return "";
  };

  const StarRating = () => {
    const displayRating = hoverRating || selectedRating;

    return (
      <div className="space-y-3">
        <div
          className="flex items-center justify-center space-x-1"
          onMouseLeave={handleStarLeave}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
            const isFilled = displayRating >= star;
            const isHalfFilled =
              displayRating >= star - 0.5 && displayRating < star;

            return (
              <div key={star} className="relative cursor-pointer">
                {/* Estrela de fundo */}
                <Star
                  className="w-8 h-8 text-slate-600 transition-all duration-200"
                  onClick={() => handleStarClick(star)}
                />

                {/* Estrela cheia ou meia */}
                {(isFilled || isHalfFilled) && (
                  <Star
                    className={`absolute top-0 left-0 w-8 h-8 text-yellow-400 fill-current transition-all duration-200 pointer-events-none ${
                      isHalfFilled ? "clip-path-half" : ""
                    }`}
                    style={isHalfFilled ? { clipPath: "inset(0 50% 0 0)" } : {}}
                  />
                )}

                {/* Área de hover para meia estrela (lado esquerdo) */}
                <div
                  className="absolute top-0 left-0 w-4 h-8 cursor-pointer z-10"
                  onMouseEnter={() => handleStarHover(star - 0.5)}
                  onClick={() => handleStarClick(star - 0.5)}
                />
                {/* Área de hover para estrela completa (lado direito) */}
                <div
                  className="absolute top-0 right-0 w-4 h-8 cursor-pointer z-10"
                  onMouseEnter={() => handleStarHover(star)}
                  onClick={() => handleStarClick(star)}
                />
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
          </div>
          {displayRating > 0 && (
            <div className="text-sm text-blue-400 font-medium">
              {getRatingDescription(displayRating)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-sm border-slate-700/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-50 text-lg">
            {currentRating ? "Editar avaliação" : "Avaliar"} {itemType}:{" "}
            {itemTitle}
          </DialogTitle>
          {currentRating && (
            <p className="text-sm text-slate-400">
              Você já avaliou este {itemType} com nota {currentRating.myVote}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating com estrelas */}
          <div className="space-y-2">
            <Label className="text-slate-300 font-medium">
              Sua avaliação (0.5 a 10 estrelas)
            </Label>
            <StarRating />
          </div>

          {/* Comentário opcional */}
          <div className="space-y-2">
            <Label className="text-slate-300 font-medium">
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
              className="bg-slate-800/80 backdrop-blur-sm border-slate-700/60 text-slate-50 placeholder-slate-400 resize-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600/60 text-slate-300 hover:bg-slate-800/80 backdrop-blur-sm transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedRating <= 0}
              className="flex-1 bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm disabled:opacity-50 transition-all shadow-lg cursor-pointer"
            >
              {isSubmitting
                ? "Enviando..."
                : currentRating
                ? "Atualizar"
                : "Avaliar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
