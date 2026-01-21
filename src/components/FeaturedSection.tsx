"use client";

import React from "react";
import { motion } from "framer-motion";
import { Gamepad2, Users, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ViewType } from "@/types";

interface GameStat {
  label: string;
  count: string;
  color: string;
}

interface HomeHeroProps {
  onNavigate: (view: ViewType) => void;
  stats?: {
    totalLiveRooms: number;
    popularGames: GameStat[];
  };
}

const HomeHero: React.FC<HomeHeroProps> = ({ onNavigate, stats }) => {
  const { t, dir } = useLanguage();

  return (
    <div className="mb-10 w-full">
      <div className="relative w-full h-[500px] rounded-3xl overflow-hidden bg-zinc-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop"
            alt="Gaming Squad"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t("liveRooms")}: {stats?.totalLiveRooms.toLocaleString() || 0}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              {t("heroTitle")}
            </h1>

            <p className="text-lg md:text-xl text-zinc-300 max-w-xl leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => onNavigate("create-room")}
                className="px-8 py-4 bg-primary hover:bg-primary-hover text-black font-bold text-lg rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
              >
                <Gamepad2 size={24} />
                {t("ctaCreate")}
              </button>

              <button
                onClick={() => onNavigate("browse")}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 border border-white/10"
              >
                <Search size={24} />
                {t("ctaJoin")}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {(stats?.popularGames || []).map((stat, i) => (
          <div
            key={i}
            className={`bg-linear-to-br ${stat.color} to-zinc-800/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between`}
          >
            <div>
              <div className="font-bold text-white">{stat.label}</div>
              <div className="text-xs text-zinc-400">{stat.count}</div>
            </div>
            <Users size={20} className="text-white/40" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeHero;
