import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const starRowRef = useRef<HTMLDivElement>(null);

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
        description: `Sua avaliação d${itemType === "filme" ? "o filme" : "a série"} "${itemTitle}" foi registrada com sucesso.`,
      });
      setSelectedRating(0);
      setComment("");
      onClose();
    } catch (error: any) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error("Erro ao avaliar", {
        description: `Não foi possível registrar sua avaliação d${itemType === "filme" ? "o" : "a"} ${itemType}.`,
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

  // Touch drag handler — maps finger position across star row to a rating
  const handleTouchOnStars = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const container = starRowRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const raw = percentage * 10;
    const rating = Math.max(0.5, Math.round(raw * 2) / 2);
    setSelectedRating(rating);
    setHoverRating(0);
  };

  const displayRating = hoverRating || selectedRating;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md p-5 sm:p-6 bg-[#14141c] border border-white/[0.06] shadow-2xl rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-white text-xl font-bold text-center sm:text-left">
            {currentRating ? "Editar Avaliação" : "Avaliar"}
          </DialogTitle>
          <p className="text-white/40 text-sm font-medium mt-1 text-center sm:text-left line-clamp-1">
            {itemTitle}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Estrelas */}
          <div className="space-y-4">
            <div
              ref={starRowRef}
              className="flex items-center justify-center gap-0.5 sm:gap-1 touch-none"
              onMouseLeave={() => setHoverRating(0)}
              onTouchStart={handleTouchOnStars}
              onTouchMove={handleTouchOnStars}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                const isFilled = displayRating >= star;
                const isHalfFilled = displayRating >= star - 0.5 && displayRating < star;
                return (
                  <div key={star} className="relative select-none touch-manipulation">
                    <Star className="w-7 h-7 sm:w-8 sm:h-8 text-white/10 transition-all duration-150" />
                    {(isFilled || isHalfFilled) && (
                      <Star
                        className="absolute top-0 left-0 w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 fill-current transition-all duration-150 pointer-events-none drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                        style={isHalfFilled ? { clipPath: "inset(0 50% 0 0)" } : {}}
                      />
                    )}
                    {/* Metade esquerda — meia estrela */}
                    <div
                      className="absolute top-0 left-0 w-[50%] h-full z-10"
                      onMouseEnter={() => setHoverRating(star - 0.5)}
                      onClick={() => setSelectedRating(star - 0.5)}
                    />
                    {/* Metade direita — estrela inteira */}
                    <div
                      className="absolute top-0 right-0 w-[50%] h-full z-10"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setSelectedRating(star)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Placar */}
            <div className="text-center bg-[#0a0a0f]/60 py-3 rounded-xl border border-white/[0.06]">
              <div className="text-3xl font-extrabold text-yellow-400 leading-none mb-1">
                {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
              </div>
              <div className="text-sm font-medium h-5 text-white/50">
                {displayRating > 0 ? getRatingDescription(displayRating) : "Selecione uma nota"}
              </div>
            </div>

            {/* Slider — principal no mobile, auxiliar no desktop */}
            <div className="px-1">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={selectedRating}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setSelectedRating(v);
                  setHoverRating(0);
                }}
                className="w-full h-2 rounded-full"
                style={{
                  background: `linear-gradient(to right, rgb(168 85 247) ${selectedRating * 10}%, rgba(255,255,255,0.08) ${selectedRating * 10}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-white/25 mt-1 px-0.5">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wide ml-1">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder={`O que você achou d${itemType === "filme" ? "este filme" : "esta série"}?`}
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              className="bg-[#0a0a0f]/60 border-white/10 text-white/90 placeholder:text-white/25 focus:border-purple-500/50 resize-none rounded-xl p-3"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm font-medium transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedRating <= 0}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/30 text-sm"
            >
              {isSubmitting
                ? "Enviando..."
                : currentRating
                  ? "Atualizar Nota"
                  : "Salvar Avaliação"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
