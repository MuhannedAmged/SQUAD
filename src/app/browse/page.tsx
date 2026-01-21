"use client";

import { useState, useEffect } from "react";
import BrowseRooms from "@/components/GameRow";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

export default function BrowsePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [discoverRooms, setDiscoverRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterGame, setFilterGame] = useState("");

  if (!user && !isLoading) {
    // We wait for loading to finish? No, auth loads fast.
    // Actually user might be null initially while loading.
    // AuthContext usually handles initial load.
  }

  // Use effect to handle redirect if we want, or just return UI.
  // Returning UI is safer to avoid hydration mismatches if user is loading.

  useEffect(() => {
    fetchRooms();
  }, [user]);

  async function fetchRooms() {
    setIsLoading(true);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("rooms")
      .select(
        `
        *,
        host:profiles!rooms_created_by_profile_fkey (
          username,
          avatar_url
        ),
        members:room_members!room_members_room_id_fkey (count)
      `
      )
      .gt("expires_at", now) // Filter out expired rooms
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", JSON.stringify(error, null, 2));
    } else if (data) {
      const mappedRooms = data.map((r: any) => ({
        id: r.id,
        game: r.game_name,
        gameImage: r.game_cover_url,
        title: r.title,
        host: {
          name: r.host?.username || "Gamer",
          avatar:
            r.host?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}`,
        },
        players: r.members?.[0]?.count || 0,
        maxPlayers: r.max_players,
        ping: Math.floor(Math.random() * 40 + 10) + "ms",
        micRequired: r.mic_required,
        region: r.region || "EU",
        status: r.status || "open",
        created_by: r.created_by,
        tags: [r.game_name, r.mic_required ? "Mic" : "No Mic"],
      }));

      if (user) {
        setMyRooms(mappedRooms.filter((r) => r.created_by === user.id));
        setDiscoverRooms(mappedRooms.filter((r) => r.created_by !== user.id));
      } else {
        setDiscoverRooms(mappedRooms);
      }
    }
    setIsLoading(false);
  }

  const handleJoinRoom = (room: any) => {
    // Navigate to room lobby (we'll implement this later)
    window.location.href = `/room/${room.id}`;
  };

  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) {
      console.error("Error deleting room:", error);
    } else {
      fetchRooms();
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-3xl font-bold text-white mb-4">
          {t("accessDenied")}
        </h2>
        <p className="text-zinc-400 mb-8 text-lg">{t("mustLogin")}</p>
        <button
          onClick={() => router.push("/login")}
          className="px-8 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover transition-colors"
        >
          {t("goToLogin")}
        </button>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="p-10 text-center animate-pulse text-zinc-500">
        Loading live lobbies...
      </div>
    );

  const filteredDiscover = discoverRooms.filter((r) =>
    r.game.toLowerCase().includes(filterGame.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      {/* My Squads Section */}
      {user && myRooms.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h2 className="text-2xl font-bold text-white">
              Your Active Squads
            </h2>
          </div>
          <BrowseRooms
            rooms={myRooms}
            onJoinRoom={handleJoinRoom}
            isOwner
            onDeleteRoom={handleDeleteRoom}
          />
        </section>
      )}

      {/* Discovery Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-zinc-700 rounded-full" />
            <h2 className="text-2xl font-bold text-white">Discover Squads</h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by game..."
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value)}
              className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {filteredDiscover.length > 0 ? (
          <BrowseRooms rooms={filteredDiscover} onJoinRoom={handleJoinRoom} />
        ) : (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-white/10">
            <p className="text-zinc-500 font-medium">
              No active squads found matching your criteria.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
