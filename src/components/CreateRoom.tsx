"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Gamepad2,
  Mic,
  Users,
  Tag,
  Search,
  Loader2,
  Check,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

interface CreateRoomProps {
  onCancel: () => void;
  onCreate: (data: any) => Promise<void> | void;
  isPro?: boolean;
}

const CreateRoom: React.FC<CreateRoomProps> = ({
  onCancel,
  onCreate,
  isPro = false,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [micRequired, setMicRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchGames = async () => {
    if (!searchQuery.trim()) return;
    setIsLoadingGames(true);
    try {
      const response = await fetch(
        `/api/rawg/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) {
      toast.error(t("selectGameError"));
      return;
    }

    if (!title.trim()) {
      toast.error(t("enterTitleError"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        game_id: selectedGame.id.toString(),
        game_name: selectedGame.name,
        game_cover_url: selectedGame.cover_url,
        title,
        max_players: maxPlayers,
        mic_required: micRequired,
      });
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">
          {t("createRoomTitle")}
        </h1>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X className="text-zinc-400" />
        </button>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        onSubmit={handleSubmit}
      >
        {/* Game Search & Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
            {t("gameLabel")}
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleSearchGames())
                }
                placeholder={t("searchPlaceholder")}
                className="w-full bg-zinc-800 border-2 border-transparent focus:border-primary rounded-xl p-4 ps-12 text-white outline-none transition-colors"
              />
              <Search
                className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-400"
                size={20}
              />
            </div>
            <button
              type="button"
              onClick={handleSearchGames}
              disabled={isLoadingGames}
              className="px-6 bg-zinc-700 rounded-xl font-bold hover:bg-zinc-600 transition-colors disabled:opacity-50"
            >
              {isLoadingGames ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                t("search")
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 max-h-60 overflow-y-auto p-1">
            {searchResults.map((game) => (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all p-2 bg-zinc-800/50 ${
                  selectedGame?.id === game.id
                    ? "border-primary ring-2 ring-primary/20 scale-105"
                    : "border-transparent opacity-100 hover:border-zinc-700"
                }`}
              >
                <div className="aspect-3/4 relative rounded-lg overflow-hidden mb-2">
                  <img
                    src={
                      game.cover_url ||
                      "https://placehold.co/300x400?text=No+Cover"
                    }
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedGame?.id === game.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="text-primary" size={24} />
                    </div>
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate text-center">
                  {game.name}
                </div>
              </div>
            ))}
          </div>
          {selectedGame && (
            <div className="text-center text-primary font-bold animate-in fade-in slide-in-from-top-1">
              {t("selected")}: {selectedGame.name}
            </div>
          )}
        </div>

        {/* Room Title */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
            {t("roomTitleLabel")}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("roomTitlePlaceholder")}
              className="w-full bg-zinc-800 border-2 border-transparent focus:border-primary rounded-xl p-4 text-white outline-none transition-colors font-medium"
            />
            <Tag
              className="absolute end-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={20}
            />
          </div>
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              {t("maxPlayersLabel")}
            </label>
            <div className="flex items-center gap-4 bg-zinc-800 p-2 rounded-xl">
              <button
                type="button"
                onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                className="w-10 h-10 flex items-center justify-center bg-zinc-700 rounded-lg text-white hover:bg-zinc-600"
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-xl text-white flex items-center justify-center gap-2">
                <Users size={20} className="text-primary" /> {maxPlayers}
              </span>
              <button
                type="button"
                onClick={() =>
                  setMaxPlayers(Math.min(isPro ? 20 : 10, maxPlayers + 1))
                }
                className="w-10 h-10 flex items-center justify-center bg-zinc-700 rounded-lg text-white hover:bg-zinc-600"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              {t("micRequired")}
            </label>
            <div
              onClick={() => setMicRequired(!micRequired)}
              className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                micRequired
                  ? "border-primary bg-primary/10"
                  : "border-zinc-700 bg-zinc-800"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  micRequired
                    ? "bg-primary text-black"
                    : "bg-zinc-600 text-zinc-300"
                }`}
              >
                <Mic size={20} />
              </div>
              <span
                className={`font-bold ${
                  micRequired ? "text-white" : "text-zinc-400"
                }`}
              >
                {micRequired ? t("micOn") : t("micOff")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 py-4 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Gamepad2 size={24} />
                {t("createBtn")}
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateRoom;
