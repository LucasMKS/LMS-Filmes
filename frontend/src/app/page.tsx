import Link from "next/link";
import { Film, Tv, Star, Heart, TrendingUp, Play } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden selection:bg-purple-500/25">

      {/* Orbs de luz decorativos */}
      <div className="pointer-events-none absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-purple-500/6 rounded-full blur-[100px] -translate-x-1/2" />

      {/* Header */}
      <header className="relative z-50 w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2.5 text-white font-black text-lg tracking-tight">
          <div className="bg-gradient-to-br from-purple-500 to-violet-700 p-1.5 rounded-xl shadow-lg shadow-purple-500/25">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          LMS{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
            Filmes
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/filmes" className="hidden sm:block">
            <button className="text-sm text-white/40 hover:text-white/80 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 font-medium">
              Explorar Catálogo
            </button>
          </Link>
          <Link href="/login">
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm px-5 py-2 rounded-xl shadow-lg shadow-purple-900/30 transition-all duration-200 hover:scale-[1.02]">
              Entrar
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-16 pb-32 max-w-5xl mx-auto w-full text-center">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 border border-purple-500/25 bg-purple-500/8 text-purple-400 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md">
          <Star className="w-3.5 h-3.5 fill-current" />
          Seu diário cinematográfico
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mb-6 leading-[1.05]">
          Descubra, avalie e{" "}
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-purple-300">
            guarde suas emoções.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Crie sua estante virtual perfeita. Acompanhe os filmes e séries que
          você já assistiu, dê suas notas, escreva comentários e analise seu
          gosto pessoal com estatísticas detalhadas.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/filmes" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-[#0a0a0f] font-bold rounded-2xl h-13 px-8 text-base transition-all duration-200 hover:scale-[1.02] shadow-xl shadow-white/5">
              <Film className="w-4 h-4" />
              Ver Filmes
            </button>
          </Link>
          <Link href="/series" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#14141c] hover:bg-[#1a1a26] border border-white/8 text-white/80 hover:text-white font-semibold rounded-2xl h-13 px-8 text-base backdrop-blur-md transition-all duration-200 hover:scale-[1.02]">
              <Tv className="w-4 h-4 text-purple-400" />
              Ver Séries
            </button>
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-24 pt-10 border-t border-white/[0.06] w-full">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-[0.2em] mb-10">
            Tudo que você precisa em um só lugar
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-7 bg-[#14141c] rounded-2xl border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:border-amber-500/20 hover:shadow-[0_8px_32px_rgba(245,158,11,0.08)] group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Star className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-base mb-2">Avaliações</h3>
              <p className="text-white/35 text-sm leading-relaxed">
                Dê notas precisas de 0 a 10 e registre sua opinião sobre a obra.
              </p>
            </div>

            <div className="flex flex-col items-center p-7 bg-[#14141c] rounded-2xl border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:border-pink-500/20 hover:shadow-[0_8px_32px_rgba(236,72,153,0.08)] group">
              <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="text-white font-bold text-base mb-2">Favoritos</h3>
              <p className="text-white/35 text-sm leading-relaxed">
                Monte sua coleção definitiva com os títulos que marcaram sua vida.
              </p>
            </div>

            <div className="flex flex-col items-center p-7 bg-[#14141c] rounded-2xl border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:border-purple-500/20 hover:shadow-[0_8px_32px_rgba(168,85,247,0.08)] group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-bold text-base mb-2">Estatísticas</h3>
              <p className="text-white/35 text-sm leading-relaxed">
                Acompanhe seu dashboard pessoal com médias e tempo assistido.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#0a0a0f] py-7">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/20 text-sm">
            © {new Date().getFullYear()} LMS Filmes.
          </p>
          <div className="flex items-center gap-1 text-sm text-white/20">
            Feito com{" "}
            <Heart className="w-3.5 h-3.5 text-red-500 mx-1 fill-current" />
          </div>
        </div>
      </footer>
    </div>
  );
}
