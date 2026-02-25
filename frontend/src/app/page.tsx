import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Film,
  Tv,
  Star,
  Heart,
  TrendingUp,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden selection:bg-blue-500/30">
      {/* EFEITOS DE LUZ NO FUNDO (GLOW) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER MINIMALISTA */}
      <header className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Play className="w-5 h-5 text-white fill-current" />
          </div>
          LMS Filmes
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/filmes" className="hidden sm:block">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800/50"
            >
              Explorar Catálogo
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/20 rounded-xl px-6">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT (HERO) */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-20 pb-32 max-w-5xl mx-auto w-full text-center">
        <Badge
          variant="outline"
          className="mb-8 border-blue-500/30 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md"
        >
          <Star className="w-4 h-4 mr-2 fill-current" />
        </Badge>{" "}
        {/* O seu novo diário cinematográfico */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Descubra, avalie e <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            guarde suas emoções.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Crie sua estante virtual perfeita. Acompanhe os filmes e séries que
          você já assistiu, dê suas notas, escreva comentários e analise o seu
          gosto pessoal com estatísticas detalhadas.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/filmes" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-xl h-14 px-8 text-lg transition-transform hover:scale-105"
            >
              <Film className="w-5 h-5 mr-2" />
              Ver Filmes
            </Button>
          </Link>
          <Link href="/series" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800 rounded-xl h-14 px-8 text-lg backdrop-blur-md transition-transform hover:scale-105"
            >
              <Tv className="w-5 h-5 mr-2 text-green-400" />
              Ver Séries
            </Button>
          </Link>
        </div>
        {/* ESTATÍSTICAS / SOCIAL PROOF (Mockup Visual) */}
        <div className="mt-20 pt-10 border-t border-slate-800/60 w-full">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">
            Tudo que você precisa em um só lugar
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-6 bg-slate-900/40 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Avaliações</h3>
              <p className="text-slate-400 text-sm">
                Dê notas precisas de 0 a 10 e registre sua opinião sobre a obra.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-slate-900/40 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Favoritos</h3>
              <p className="text-slate-400 text-sm">
                Monte sua coleção definitiva com os títulos que marcaram sua
                vida.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-slate-900/40 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Estatísticas
              </h3>
              <p className="text-slate-400 text-sm">
                Acompanhe seu dashboard pessoal com médias e tempo assistido.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} LMS Filmes.
          </p>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            Feito com{" "}
            <Heart className="w-4 h-4 text-red-500 mx-1 fill-current" />
          </div>
        </div>
      </footer>
    </div>
  );
}
