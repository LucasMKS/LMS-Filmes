"use client";

import Link from "next/link";
import { Film, Tv, Star, Heart, Play, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePageClient() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden selection:bg-purple-500/25">

      {/* Orbs de luz decorativos */}
      <div className="pointer-events-none absolute top-[-15%] left-[-8%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] animate-pulse duration-[10s]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-600/12 rounded-full blur-[160px] animate-pulse duration-[8s]" />
      <div className="pointer-events-none absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[140px]" />

      {/* Header */}
      <header className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 text-white font-black text-xl tracking-tight"
        >
          <div className="bg-gradient-to-br from-purple-500 to-violet-700 p-2 rounded-xl shadow-lg shadow-purple-500/25">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          LMS{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
            Filmes
          </span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <Link href="/filmes" className="hidden sm:block">
            <button className="text-sm text-white/50 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 font-semibold">
              Explorar
            </button>
          </Link>
          <Link href="/login">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold text-sm px-6 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] backdrop-blur-md">
              Entrar
            </button>
          </Link>
        </motion.div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-12 pb-32 max-w-6xl mx-auto w-full text-center">

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2.5 border border-purple-500/30 bg-purple-500/10 text-purple-300 px-5 py-2 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.15)] uppercase tracking-widest"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          Mais do que uma lista, uma experiência
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.95]"
        >
          Seu próximo filme <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">
            começa aqui.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg sm:text-2xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
        >
          Organize sua jornada cinéfila. Avalie com precisão, salve para depois 
          e descubra títulos baseados no que você realmente ama.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/filmes" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white font-black rounded-2xl h-14 px-10 text-lg transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_40px_rgba(147,51,234,0.4)] shadow-xl">
              <Film className="w-5 h-5" />
              Explorar Filmes
            </button>
          </Link>
          <Link href="/series" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl h-14 px-10 text-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.05]">
              <Tv className="w-5 h-5 text-purple-400" />
              Ver Séries
            </button>
          </Link>
        </motion.div>

        {/* Floating Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-20 flex flex-wrap justify-center gap-6"
        >
          <div className="flex items-center gap-2 text-white/40 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Milhares de títulos
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            100% Gratuito
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Comunidade Ativa
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-32 pt-20 border-t border-white/[0.06] w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={item} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur opacity-0 group-hover:opacity-10 transition duration-500" />
              <div className="relative flex flex-col items-center p-8 bg-[#14141c]/50 rounded-3xl border border-white/[0.06] backdrop-blur-sm transition-all duration-500 hover:border-amber-500/30 hover:translate-y-[-8px]">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                </div>
                <h3 className="text-white font-black text-lg mb-3">Avaliações de Elite</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Sistema de notas precisas com suporte a comentários detalhados e emojis.
                </p>
              </div>
            </motion.div>

            <motion.div variants={item} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-600 rounded-3xl blur opacity-0 group-hover:opacity-10 transition duration-500" />
              <div className="relative flex flex-col items-center p-8 bg-[#14141c]/50 rounded-3xl border border-white/[0.06] backdrop-blur-sm transition-all duration-500 hover:border-pink-500/30 hover:translate-y-[-8px]">
                <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Heart className="w-6 h-6 text-pink-400 fill-pink-400/20" />
                </div>
                <h3 className="text-white font-black text-lg mb-3">Sua Coleção Pessoal</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Crie sua watchlist e favoritos. Nunca mais esqueça o que você quer assistir.
                </p>
              </div>
            </motion.div>

            <motion.div variants={item} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl blur opacity-0 group-hover:opacity-10 transition duration-500" />
              <div className="relative flex flex-col items-center p-8 bg-[#14141c]/50 rounded-3xl border border-white/[0.06] backdrop-blur-sm transition-all duration-500 hover:border-purple-500/30 hover:translate-y-[-8px]">
                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Zap className="w-6 h-6 text-purple-400 fill-purple-400/20" />
                </div>
                <h3 className="text-white font-black text-lg mb-3">Velocidade Máxima</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Interface ultra-rápida e otimizada para você focar no que importa: o filme.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#09090b] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white/30 font-bold">
            <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
              <Play className="w-3.5 h-3.5" />
            </div>
            LMS FILMES
          </div>
          <div className="flex items-center gap-8">
            <Link href="/filmes" className="text-sm text-white/20 hover:text-white transition-colors">Filmes</Link>
            <Link href="/series" className="text-sm text-white/20 hover:text-white transition-colors">Séries</Link>
          </div>
          <p className="text-white/20 text-xs font-medium">
            © {new Date().getFullYear()} — Feito com paixão pelo cinema.
          </p>
        </div>
      </footer>
    </div>
  );
}
