import confetti from "canvas-confetti";

export const celebrateAction = (type: "rating" | "favorite" | "watchlist") => {
  const colors = {
    rating: ["#f59e0b", "#fbbf24", "#ffffff"], // Amber/Gold
    favorite: ["#ec4899", "#f472b6", "#ffffff"], // Pink
    watchlist: ["#10b981", "#34d399", "#ffffff"], // Emerald
  };

  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  if (type === "rating") {
    // Efeito de explosão central para notas
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors.rating,
      disableForReducedMotion: true,
    });
  } else {
    // Efeito de confete lateral contínuo para favoritos/watchlist
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: colors[type],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: colors[type],
      });
    }, 250);
  }
};
