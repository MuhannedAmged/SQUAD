"use client";

import React from "react";
import { supabase } from "@/lib/supabase";
import HomeHero from "@/components/FeaturedSection";
import BrowseRooms from "@/components/GameRow";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<{
    totalLiveRooms: number;
    popularGames: { label: string; count: string; color: string }[];
  }>({
    totalLiveRooms: 0,
    popularGames: [],
  });

  const fetchRooms = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          `
          *,
          members:room_members (
            user_id,
            is_host
          ),
          owner:profiles (
            username,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform Data
      const formattedRooms = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        game: r.game_name,
        gameImage: r.game_cover_url,
        maxPlayers: r.max_players,
        micRequired: r.mic_required,
        region: r.region || "EU",
        ping: Math.floor(Math.random() * 50) + 10, // Mock ping for now
        tags: r.tags || [],
        players: r.members?.length || 0,
        status: r.status,
        host: {
          name: r.owner?.username || "Host",
          avatar:
            r.owner?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.owner_id}`,
        },
      }));

      setRooms(formattedRooms);

      // Compute Stats
      const totalRooms = formattedRooms.length;
      const gameCounts: Record<string, number> = {};
      formattedRooms.forEach((r: any) => {
        gameCounts[r.game] = (gameCounts[r.game] || 0) + 1;
      });

      // Sort games by popularity (count)
      const sortedGames = Object.entries(gameCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4);

      const colors = [
        "from-red-500/20",
        "from-purple-500/20",
        "from-green-500/20",
        "from-blue-500/20",
      ];

      const popularGames = sortedGames.map(([game, count], idx) => ({
        label: game,
        count: `${count}+ Rooms`,
        color: colors[idx % colors.length],
      }));

      // If we don't have enough data, fill with some defaults or just show what we have
      if (popularGames.length === 0) {
        // Fallback defaults if empty
        popularGames.push(
          { label: "Valorant", count: "0 Rooms", color: "from-red-500/20" },
          { label: "Fortnite", count: "0 Rooms", color: "from-purple-500/20" }
        );
      }

      setStats({
        totalLiveRooms: totalRooms, // Ideally fetch simple count from DB ignoring limit, but this is fine for now
        popularGames,
      });
    } catch (error) {
      console.error(
        "Error fetching homepage data:",
        JSON.stringify(error, null, 2)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRooms();

    // Subscribe to changes (Optional, maybe overkill for generic home page list but good for "Live")
    const channel = supabase
      .channel("home_rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  const handleJoinRoom = (room: any) => {
    router.push(`/room/${room.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <HomeHero onNavigate={(view) => router.push(`/${view}`)} stats={stats} />

      <div className="mb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 bg-zinc-900/50 animate-pulse rounded-2xl border border-white/5"
              />
            ))}
          </div>
        ) : (
          <BrowseRooms rooms={rooms} onJoinRoom={handleJoinRoom} />
        )}
      </div>
    </motion.div>
  );
}
