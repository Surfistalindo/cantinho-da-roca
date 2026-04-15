"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Leaf, Flame, Cookie, Heart, Droplets, Wheat, Sun, Coffee, Flower2, Apple } from "lucide-react";

const FEATURES = [
  {
    id: "chas",
    label: "Chás Naturais",
    icon: Leaf,
    image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?q=80&w=1200",
    description: "Chás funcionais para emagrecer, desinflamar e relaxar. 100% natural.",
  },
  {
    id: "ervas",
    label: "Ervas Medicinais",
    icon: Flower2,
    image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=1200",
    description: "Ervas selecionadas com propriedades terapêuticas comprovadas.",
  },
  {
    id: "temperos",
    label: "Temperos & Especiarias",
    icon: Flame,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1200",
    description: "Temperos frescos e artesanais pra dar sabor às suas refeições.",
  },
  {
    id: "suplementos",
    label: "Suplementos Naturais",
    icon: Heart,
    image: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=1200",
    description: "Suplementos para mais disposição e bem-estar no dia a dia.",
  },
  {
    id: "graos",
    label: "Grãos & Farinhas",
    icon: Wheat,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=1200",
    description: "Grãos integrais e farinhas artesanais sem aditivos químicos.",
  },
  {
    id: "oleos",
    label: "Óleos Essenciais",
    icon: Droplets,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=1200",
    description: "Óleos puros para aromaterapia e cuidados com o corpo.",
  },
  {
    id: "mel",
    label: "Mel & Própolis",
    icon: Sun,
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=1200",
    description: "Mel puro de abelha e própolis para fortalecer a imunidade.",
  },
  {
    id: "artesanais",
    label: "Produtos Artesanais",
    icon: Cookie,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200",
    description: "Feitos à mão com ingredientes naturais e muito carinho.",
  },
  {
    id: "infusoes",
    label: "Infusões Especiais",
    icon: Coffee,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1200",
    description: "Blends exclusivos criados para momentos únicos de bem-estar.",
  },
  {
    id: "frutas",
    label: "Frutas Desidratadas",
    icon: Apple,
    image: "https://images.unsplash.com/photo-1589917625571-871b5744f777?q=80&w=1200",
    description: "Snacks naturais e saudáveis para o seu dia a dia.",
  },
];

const AUTO_PLAY_INTERVAL = 3000;
const ITEM_HEIGHT = 65;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentIndex =
    ((step % FEATURES.length) + FEATURES.length) % FEATURES.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + FEATURES.length) % FEATURES.length;
    if (diff > 0) setStep((s) => s + diff);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = FEATURES.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return "active";
    if (normalizedDiff === -1) return "prev";
    if (normalizedDiff === 1) return "next";
    return "hidden";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
        {/* Left side - Chips list */}
        <div className="w-full lg:w-[45%] relative">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex flex-col gap-2 py-4"
            animate={{ y: -(currentIndex * ITEM_HEIGHT) + ITEM_HEIGHT * 2 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            {FEATURES.map((feature, index) => {
              const isActive = index === currentIndex;
              const distance = index - currentIndex;
              const wrappedDistance = wrap(
                -(FEATURES.length / 2),
                FEATURES.length / 2,
                distance
              );

              return (
                <motion.div
                  key={feature.id}
                  animate={{
                    opacity: Math.abs(wrappedDistance) > 3 ? 0 : 1 - Math.abs(wrappedDistance) * 0.2,
                    scale: isActive ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <button
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      "relative flex items-center gap-4 px-6 md:px-10 lg:px-8 py-3.5 md:py-5 lg:py-4 rounded-full transition-all duration-700 text-left group border w-full",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary z-10 shadow-lg"
                        : "bg-transparent text-foreground/60 border-border/40 hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-500",
                      isActive ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      <feature.icon className="w-4 h-4" />
                    </span>

                    <span className="text-sm font-semibold tracking-wide">
                      {feature.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right side - Image cards */}
        <div className="w-full lg:w-[55%] relative h-[400px] sm:h-[500px]">
          <div className="relative w-full h-full" style={{ perspective: "1200px" }}>
            {FEATURES.map((feature, index) => {
              const status = getCardStatus(index);
              const isActive = status === "active";
              const isPrev = status === "prev";
              const isNext = status === "next";

              return (
                <AnimatePresence key={feature.id}>
                  {(isActive || isPrev || isNext) && (
                    <motion.div
                      className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
                      initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
                      animate={{
                        opacity: isActive ? 1 : 0.4,
                        scale: isActive ? 1 : 0.85,
                        rotateY: isPrev ? -15 : isNext ? 15 : 0,
                        x: isPrev ? -60 : isNext ? 60 : 0,
                        z: isActive ? 0 : -100,
                      }}
                      exit={{ opacity: 0, scale: 0.8, rotateY: -45 }}
                      transition={{ type: "spring", stiffness: 200, damping: 30 }}
                      style={{ transformStyle: "preserve-3d", zIndex: isActive ? 10 : 1 }}
                    >
                      {/* Image */}
                      <img
                        src={feature.image}
                        alt={feature.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="absolute bottom-0 left-0 right-0 p-6 sm:p-8"
                          >
                            <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-2">
                              {index + 1} • {feature.label}
                            </p>

                            <p className="text-white text-lg sm:text-xl font-serif leading-snug">
                              {feature.description}
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {/* Badge */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white text-xs font-medium">
                          100% Natural
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
