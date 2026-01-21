"use client";

import React from "react";
import { motion } from "framer-motion";
import { Room } from "@/types";
import { Mic, MicOff, Users, Globe, PlayCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BrowseRoomsProps {
  rooms: any[];
  onJoinRoom: (room: any) => void;
  isOwner?: boolean;
  onDeleteRoom?: (roomId: string) => void;
}

const BrowseRooms: React.FC<BrowseRoomsProps> = ({
  rooms,
  onJoinRoom,
  isOwner,
  onDeleteRoom,
}) => {
  const { t, dir } = useLanguage();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{t("browseRooms")}</h2>

        <div className="flex gap-2">
          {/* Simple Filter Mockups */}
          <button className="px-4 py-2 bg-zinc-800 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
            {t("filterGame")}
          </button>
          <button className="px-4 py-2 bg-zinc-800 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
            {t("filterRegion")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room, idx) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer flex flex-col h-full"
            onClick={() => onJoinRoom(room)}
          >
            {/* Room Image Header */}
            <div className="h-40 relative overflow-hidden">
              <img
                src={room.gameImage}
                alt={room.game}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent opacity-90" />

              <div className="absolute top-3 start-3">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase tracking-wider">
                  {room.game}
                </span>
              </div>

              <div className="absolute top-3 end-3 flex gap-2">
                {room.micRequired ? (
                  <div
                    className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white"
                    title={t("micOn")}
                  >
                    <Mic size={14} />
                  </div>
                ) : (
                  <div
                    className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-zinc-400"
                    title={t("micOff")}
                  >
                    <MicOff size={14} />
                  </div>
                )}
              </div>

              <div className="absolute bottom-3 start-3 w-full pe-6">
                <h3 className="text-white font-bold text-lg truncate leading-tight shadow-black drop-shadow-md">
                  {room.title}
                </h3>
              </div>
            </div>

            {/* Room Details */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={room.host.avatar}
                  alt={room.host.name}
                  className="w-8 h-8 rounded-full border border-zinc-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {room.host.name}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    <Globe size={10} /> {room.region} • {room.ping}ms
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {room.tags.slice(0, 3).map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-white/5 text-zinc-400 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm font-medium">
                  <Users size={16} />
                  <span>
                    {Array.isArray(room.players)
                      ? room.players.length
                      : room.players}
                    /{room.maxPlayers}
                  </span>
                </div>

                {isOwner ? (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRoom?.(room.id);
                      }}
                      className="px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      {t("disconnect") || "Close"}
                    </button>
                    <button className="px-4 py-1.5 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1">
                      {t("join")} <PlayCircle size={14} />
                    </button>
                  </div>
                ) : (Array.isArray(room.players)
                    ? room.players.length
                    : room.players) >= room.maxPlayers ||
                  room.status === "full" ? (
                  <button
                    disabled
                    className="px-4 py-1.5 bg-zinc-800 text-zinc-500 text-xs font-bold rounded-lg flex items-center gap-1 cursor-not-allowed border border-transparent"
                  >
                    {t("statusFull")}
                  </button>
                ) : (
                  <button className="px-4 py-1.5 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1">
                    {t("join")} <PlayCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BrowseRooms;
