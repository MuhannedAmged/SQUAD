import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Download,
  Share2,
  Heart,
  Monitor,
  Cpu,
  HardDrive,
  ShoppingCart,
  Play,
} from "lucide-react";
import { Game } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface GameDetailsProps {
  game: Game;
  onBack: () => void;
}

const GameDetails: React.FC<GameDetailsProps> = ({ game, onBack }) => {
  const { t, dir } = useLanguage();

  return (
    <div className="w-full pb-10">
      {/* Hero Banner */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent" />
        </div>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onClick={onBack}
          className="absolute top-6 start-6 z-10 flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-xl text-white transition-colors border border-white/10"
        >
          <ArrowLeft size={20} className={dir === "rtl" ? "rotate-180" : ""} />
          <span>{t("back")}</span>
        </motion.button>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-32 md:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Column - Cover & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full md:w-[350px] shrink-0 space-y-6"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-800 aspect-3/4">
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1, delay: 0.1 }}
                src={game.image}
                alt={game.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <button className="w-full py-4 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl text-lg shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                <ShoppingCart size={20} />
                {t("buyNow")} {game.price || "$59.99"}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/5">
                  <Heart size={20} className="text-red-500" />
                  {t("wishlist")}
                </button>
                <button className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/5">
                  <Share2 size={20} />
                  {t("share")}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex-1 pt-4 md:pt-12"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                {game.tag && (
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-lg mb-3">
                    {game.tag === "New" ? t("new") : game.tag}
                  </span>
                )}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                  {game.title}
                </h1>
                <div className="flex items-center gap-4 text-zinc-400 text-sm">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold text-white text-base">4.8</span>
                    <span className="text-zinc-500">
                      (12.5k {t("reviews")})
                    </span>
                  </div>
                  <span className="w-1 h-1 bg-zinc-400 rounded-full" />
                  <span>Action RPG</span>
                  <span className="w-1 h-1 bg-zinc-400 rounded-full" />
                  <span>{t("released")} 2024</span>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-zinc-300 mb-8">
              <p className="text-lg leading-relaxed">
                {game.subtitle ||
                  "Experience an epic open-world adventure that redefines the genre. Explore vast landscapes, fight terrifying beasts, and uncover ancient mysteries in a visually stunning universe tailored for next-gen hardware."}
              </p>
              <p className="mt-4">
                Immerse yourself in a narrative-driven campaign or team up with
                friends in multiplayer modes. With dynamic weather systems,
                realistic physics, and deep character customization, every
                playthrough offers a unique journey.
              </p>
            </div>

            {/* Media Gallery Grid */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-white mb-4">
                {t("gallery")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-xl overflow-hidden bg-zinc-800 relative group cursor-pointer"
                  >
                    <img
                      src={`https://picsum.photos/id/${
                        100 + i + (typeof game.id === "number" ? game.id : 0)
                      }/400/300`}
                      alt="Screenshot"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play
                        size={32}
                        className="text-white"
                        fill="currentColor"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Requirements */}
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-6">
                {t("systemReqs")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">{t("minimum")}</h4>
                  <div className="flex items-start gap-3">
                    <Monitor className="text-zinc-400 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-zinc-500 uppercase font-bold">
                        {t("os")}
                      </span>
                      <span className="text-sm text-zinc-300">
                        Windows 10 64-bit
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cpu className="text-zinc-400 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-zinc-500 uppercase font-bold">
                        {t("processor")}
                      </span>
                      <span className="text-sm text-zinc-300">
                        Intel Core i5-4460 or AMD Ryzen 3 1200
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary">
                    {t("recommended")}
                  </h4>
                  <div className="flex items-start gap-3">
                    <HardDrive className="text-zinc-400 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-zinc-500 uppercase font-bold">
                        {t("storage")}
                      </span>
                      <span className="text-sm text-zinc-300">
                        150 GB {t("availableSpace")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cpu className="text-zinc-400 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-zinc-500 uppercase font-bold">
                        {t("memory")}
                      </span>
                      <span className="text-sm text-zinc-300">16 GB RAM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
