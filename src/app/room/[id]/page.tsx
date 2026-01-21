"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoomLobby from "@/components/RoomLobby";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    micRequired: false,
    maxPlayers: 5,
  });

  const fetchRoomAndJoin = React.useCallback(
    async (autoJoin = true) => {
      if (!id || !user) return;

      // 1. Fetch room details with members and their profiles in one join
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(
          `
        *,
        members:room_members (
          user_id,
          is_host,
          is_ready,
          profiles:user_id (
            username,
            avatar_url
          )
        )
      `
        )
        .eq("id", id)
        .single();

      if (roomError || !roomData) {
        toast.error("Room not found or expired");
        router.push("/browse");
        return;
      }

      // Check if expired
      if (new Date(roomData.expires_at) < new Date()) {
        toast.error("This room has expired");
        router.push("/browse");
        return;
      }

      const mappedRoom = {
        id: roomData.id,
        title: roomData.title,
        game: roomData.game_name,
        gameImage: roomData.game_cover_url,
        maxPlayers: roomData.max_players,
        micRequired: roomData.mic_required,
        region: roomData.region || "EU",
        players: (roomData.members || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.username || "Gamer",
          avatar:
            m.profiles?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`,
          isReady: m.is_ready,
          isHost: m.is_host,
        })),
      };

      setRoom(mappedRoom);
      setLoading(false);

      if (!user) return;

      const isMemberDirect = mappedRoom.players.some(
        (p: any) => p.id === user.id
      );

      // If we are definitely NOT a member in the fetched list
      if (!isMemberDirect) {
        // Double check membership directly to ensure we don't hit 409 Conflict
        const { data: memberCheck } = await supabase
          .from("room_members")
          .select("id")
          .eq("room_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberCheck) {
          fetchRoomAndJoin(false);
          return;
        }

        if (!autoJoin) {
          toast.error("You have been removed from the room");
          router.replace("/browse");
          return;
        }

        if (mappedRoom.players.length >= mappedRoom.maxPlayers) {
          toast.error("Room is full");
          router.push("/browse");
          return;
        }

        // Try to join
        const { error: joinError } = await supabase
          .from("room_members")
          .insert({
            room_id: id,
            user_id: user.id,
            is_host: false,
            is_ready: false,
            status: "pending",
          });

        if (joinError) {
          const isConflict =
            joinError.code === "23505" ||
            joinError.code === "409" ||
            joinError.message.includes("violates unique constraint");

          if (isConflict) {
            fetchRoomAndJoin(false);
            return;
          }

          // Fallback for legacy schema
          const { error: fallbackError } = await supabase
            .from("room_members")
            .insert({
              room_id: id,
              user_id: user.id,
              is_host: false,
              is_ready: false,
            });

          if (fallbackError) {
            const isFallbackConflict =
              fallbackError.code === "23505" ||
              fallbackError.code === "409" ||
              fallbackError.message.includes("violates unique constraint");

            if (!isFallbackConflict) {
              toast.error(`Failed to join: ${fallbackError.message}`);
              return;
            }
          }
        }

        // If we reached here, it means we joined (either directly or via fallback)
        toast.success("Joined room!");

        // Notify owner
        if (roomData.created_by !== user.id) {
          const channelId = `user-notifications:${roomData.created_by}`;
          const channel = supabase.channel(channelId);
          await channel.send({
            type: "broadcast",
            event: "ROOM_JOINED",
            payload: {
              roomId: id,
              roomTitle: roomData.title,
              joinedUserId: user.id,
              joinedUserName: user.name,
              timestamp: Date.now(),
            },
          });
          supabase.removeChannel(channel);
        }

        fetchRoomAndJoin(false);
      }
    },
    [id, user, router]
  );

  useEffect(() => {
    if (!id || !user) return;

    // Initial load: Auto-join
    fetchRoomAndJoin(true);

    // 3. Subscribe to room member changes
    const channel = supabase
      .channel(`room_members_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${id}`,
        },
        (payload: any) => {
          // If DELETE event, check if it's us
          if (payload.eventType === "DELETE") {
            // payload.old contains the record that was deleted (needs REPLICA IDENTITY FULL or PK)
            // Assuming room_members has user_id as part of PK or identity
            if (payload.old && payload.old.user_id === user.id) {
              toast.error("You have been kicked from the room");
              router.replace("/browse");
              return;
            }
            // If someone else was removed, we refresh only if we are still here
            fetchRoomAndJoin(false);
          } else {
            // INSERT or UPDATE
            fetchRoomAndJoin(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, fetchRoomAndJoin]);

  const handleToggleReady = async (isReady: boolean) => {
    if (!user || !id) return;
    await supabase
      .from("room_members")
      .update({ is_ready: isReady })
      .eq("room_id", id)
      .eq("user_id", user.id);
  };

  const handleEditRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    // Optimistic update
    setRoom((prev: any) => ({
      ...prev,
      title: editFormData.title,
      micRequired: editFormData.micRequired,
      maxPlayers: editFormData.maxPlayers,
    }));
    setIsEditModalOpen(false);

    const { error } = await supabase
      .from("rooms")
      .update({
        title: editFormData.title,
        mic_required: editFormData.micRequired,
        max_players: editFormData.maxPlayers,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update room");
      // Revert would be good here but simpler to just show error for now
    } else {
      toast.success("Room updated successfully");
    }
  };

  const handleLeave = async () => {
    if (!user || !id) return;

    // If host leaves, we could delete the room or transfer host
    // For now, just remove the member
    await supabase
      .from("room_members")
      .delete()
      .eq("room_id", id)
      .eq("user_id", user.id);

    router.push("/browse");
  };

  const handleKick = async (targetUserId: string) => {
    if (
      !user ||
      room?.players.find((p: any) => p.id === user.id)?.isHost !== true
    )
      return;

    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", id)
      .eq("user_id", targetUserId);

    if (error) {
      toast.error("Failed to kick player");
      // Revert optimistic update? Fetch again.
      fetchRoomAndJoin(false);
    } else {
      // Optimistic update
      setRoom((prev: any) => ({
        ...prev,
        players: prev.players.filter((p: any) => p.id !== targetUserId),
      }));
      toast.success("Player kicked");
    }
  };

  const handleAccept = async (targetUserId: string) => {
    if (!user || !id) return;
    const { error } = await supabase
      .from("room_members")
      .update({ status: "approved" })
      .eq("room_id", id)
      .eq("user_id", targetUserId);

    if (error) {
      toast.error("Failed to accept request");
    } else {
      toast.success("Request accepted");
      fetchRoomAndJoin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-primary animate-pulse text-xl font-bold">
          Connecting to Lobby...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <RoomLobby
        room={room}
        currentUser={{
          id: user?.id || "",
          name: user?.name || "Gamer",
          avatar: user?.avatar || "",
          isReady:
            room.players.find((p: any) => p.id === user?.id)?.isReady || false,
          isHost:
            room.players.find((p: any) => p.id === user?.id)?.isHost || false,
          status:
            room.players.find((p: any) => p.id === user?.id)?.status ||
            "joined",
        }}
        onLeave={handleLeave}
        onToggleReady={handleToggleReady}
        onKick={handleKick}
        onAccept={handleAccept}
        onEditRoom={() => {
          setEditFormData({
            title: room.title,
            micRequired: room.micRequired,
            maxPlayers: room.maxPlayers,
          });
          setIsEditModalOpen(true);
        }}
      />

      {/* Edit Room Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Edit Room</h3>
            <form onSubmit={handleEditRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Room Title
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Max Players
                </label>
                <select
                  value={editFormData.maxPlayers}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      maxPlayers: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {/* Generate options based on Pro status */}
                  {(user?.isPro
                    ? [2, 3, 4, 5, 10, 12, 15, 20]
                    : [2, 3, 4, 5, 10]
                  ).map((num) => (
                    <option key={num} value={num}>
                      {num} Players
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl cursor-pointer"
                onClick={() =>
                  setEditFormData({
                    ...editFormData,
                    micRequired: !editFormData.micRequired,
                  })
                }
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    editFormData.micRequired
                      ? "bg-primary border-primary"
                      : "border-zinc-500"
                  }`}
                >
                  {editFormData.micRequired && (
                    <div className="w-2.5 h-2.5 bg-black rounded-sm" />
                  )}
                </div>
                <span className="text-sm text-zinc-300">
                  Microphone Required
                </span>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-black hover:bg-primary-hover transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
