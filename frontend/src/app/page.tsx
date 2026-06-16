import { Metadata } from "next";
import Link from "next/link";
import { Film, Tv, Star, Heart, TrendingUp, Play, CheckCircle2, Sparkles, Zap } from "lucide-react";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "LMS Filmes | Sua Coleção de Cinema",
  description: "Descubra, avalie e organize seus filmes e séries favoritos. O LMS Filmes é o seu diário cinematográfico pessoal.",
};

export default function HomePage() {
  return <HomePageClient />;
}
