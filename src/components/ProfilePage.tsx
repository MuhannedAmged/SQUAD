"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Trophy,
  Edit2,
  LogOut,
  Swords,
  Target,
  Crosshair,
  Users,
  Star,
  Shield,
  UserPlus,
  Gamepad2,
} from "lucide-react";
import { User as UserType } from "@/types";

import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getLastSeen } from "@/lib/utils";
interface ProfilePageProps {
  user: UserType;
  onLogout?: () => void;
  targetUserId?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onLogout,
  targetUserId,
}) => {
  const { t, dir } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverTableOpen, setIsCoverTableOpen] = useState(false); // Using "Table" as "Modal" or generic name
  const router = useRouter();
  const { refreshUser } = useAuth();

  const isOwnProfile = !targetUserId || targetUserId === user.id;

  const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mark",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jonas",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
  ];

  const PRESET_COVERS = [
    "https://picsum.photos/id/1041/1200/400",
    "https://picsum.photos/id/1018/1200/400",
    "https://picsum.photos/id/1015/1200/400",
    "https://picsum.photos/id/1002/1200/400",
    "https://picsum.photos/id/1035/1200/400",
  ];

  const handleUpdateProfile = async (updates: any) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        toast.error(t("failedToUpdate"));
        return;
      }

      toast.success(t("profileUpdated"));

      // Refresh profile data
      await fetchProfile();

      // Update AuthContext if avatar changed
      if (updates.avatar_url && refreshUser) {
        await refreshUser();
      }

      setIsAvatarModalOpen(false);
      setIsCoverTableOpen(false);
    } catch (err) {
      console.error("Update profile error:", err);
      toast.error(t("failedToUpdate"));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user, targetUserId]);

  const fetchProfile = async () => {
    const idToFetch = targetUserId || user.id;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", idToFetch)
      .single();
    if (error || !data) {
      toast.error(t("profileNotFound"));
      router.push("/profile");
      return;
    }

    if (data) {
      setProfile(data);
      if (!isOwnProfile) {
        checkFriendStatus(idToFetch);
      }
      setProfile(data);
      if (!isOwnProfile) {
        checkFriendStatus(idToFetch);
      }
      fetchFriends(idToFetch);
      fetchActiveRooms(idToFetch);
      fetchRecentlyPlayed(idToFetch);
    }
  };

  const fetchActiveRooms = async (userId: string) => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("created_by", userId)
      .gt("expires_at", new Date().toISOString());

    if (data && !error) {
      // Get member counts for these rooms
      const roomsWithCounts = await Promise.all(
        data.map(async (room: any) => {
          const { count } = await supabase
            .from("room_members")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id);
          return { ...room, member_count: count || 0 };
        })
      );
      setActiveRooms(roomsWithCounts);
    }
  };

  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);

  const fetchRecentlyPlayed = async (userId: string) => {
    try {
      // Join room_members -> rooms to get recent games
      const { data, error } = await supabase
        .from("room_members")
        .select(
          `
          joined_at,
          room_id,
          rooms (
            game_name,
            game_cover_url
          )
        `
        )
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Recently played error:", error);
        return;
      }

      if (data) {
        // Filter unique games manually
        const gamesMap = new Map();

        data.forEach((item: any) => {
          const gameName = item.rooms?.game_name;
          if (gameName && !gamesMap.has(gameName)) {
            gamesMap.set(gameName, {
              title: gameName,
              image: item.rooms?.game_cover_url,
              lastPlayed: new Date(item.joined_at),
            });
          }
        });

        setRecentlyPlayed(Array.from(gamesMap.values()).slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to fetch recently played:", err);
    }
  };

  const fetchFriends = async (userId: string) => {
    setLoadingFriends(true);
    // Fetch where user is sender
    const { data: sent, error: sentErr } = await supabase
      .from("friends")
      .select(
        "receiver_id, profiles!receiver_id(id, username, avatar_url, is_pro, updated_at)"
      )
      .eq("sender_id", userId)
      .eq("status", "accepted");

    // Fetch where user is receiver
    const { data: received, error: receivedErr } = await supabase
      .from("friends")
      .select(
        "sender_id, profiles!sender_id(id, username, avatar_url, is_pro, updated_at)"
      )
      .eq("receiver_id", userId)
      .eq("status", "accepted");

    if (!sentErr && !receivedErr) {
      const allFriends = [
        ...(sent?.map((f: any) => f.profiles) || []),
        ...(received?.map((f: any) => f.profiles) || []),
      ].filter((f) => f !== null);
      setFriends(allFriends);
    }
    setLoadingFriends(false);
  };

  const checkFriendStatus = async (targetId: string) => {
    const { data, error } = await supabase
      .from("friends")
      .select("status, sender_id")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    if (data) {
      setFriendStatus(data.status);
    } else {
      setFriendStatus(null);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile || isSendingRequest) return;
    setIsSendingRequest(true);
    try {
      const { error } = await supabase.from("friends").insert({
        sender_id: user.id,
        receiver_id: profile.id,
        status: "pending",
      });
      if (!error) {
        // Create notification for receiver
        await supabase.from("notifications").insert({
          user_id: profile.id,
          type: "friend_request",
          title: "New Friend Request",
          content: `${user.name} sent you a friend request`,
          link: `/profile/${user.id}`,
          is_read: false,
        });

        setFriendStatus("pending");
        toast.success("Friend request sent!");
      } else {
        toast.error("Failed to send request");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (
      !profile ||
      confirm(
        t("confirmRemoveFriend") ||
          "Are you sure you want to remove this friend?"
      )
    ) {
      try {
        const { error } = await supabase
          .from("friends")
          .delete()
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`
          );

        if (error) {
          toast.error("Failed to remove friend");
        } else {
          toast.success("Friend removed");
          setFriendStatus(null);
          // Optimistically remove from local list if needed, or just re-fetch
          fetchFriends(user.id);
        }
      } catch (err) {
        console.error("Error removing friend:", err);
      }
    }
  };

  const handleCancelRequest = async () => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`
        );
      if (!error) {
        setFriendStatus(null);
        toast.success("Request cancelled");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const displayAvatar = isOwnProfile
    ? user.avatar
    : profile?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserId}`;

  return (
    <div className="max-w-6xl mx-auto w-full pb-10">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-24"
      >
        <div
          className={`h-64 rounded-3xl overflow-hidden relative group ${
            isOwnProfile ? "cursor-pointer" : ""
          }`}
          onClick={() => isOwnProfile && setIsCoverTableOpen(true)}
        >
          <img
            src={
              // Try to find cover_url in profile, else fallback
              profile?.cover_url || "https://picsum.photos/id/1041/1200/400"
            }
            alt="Cover"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md text-white font-medium">
                <Edit2 size={18} /> {t("changeCover")}
              </span>
            </div>
          )}
        </div>

        {/* Profile Info Card */}
        <div className="absolute -bottom-12 max-md:start-2 md:start-12 flex items-end gap-6">
          <div
            className={`max-md:w-22 max-md:h-22 w-40 h-40 rounded-full border-4 border-background overflow-hidden bg-zinc-800 shadow-xl relative group ${
              isOwnProfile ? "cursor-pointer" : ""
            }`}
            onClick={() => isOwnProfile && setIsAvatarModalOpen(true)}
          >
            <img
              src={displayAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Edit2 size={24} className="text-white" />
              </div>
            )}
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-1">
              <h1 className="max-md:text-2xl text-3xl font-bold text-white">
                {profile?.username || user.name}
              </h1>
              {(isOwnProfile ? user.isPro : profile?.is_pro) && (
                <span className="px-2 py-0.5 bg-primary text-black text-xs font-bold rounded">
                  {t("pro")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-zinc-400 text-sm">
              <span>
                {profile?.is_pro &&
                profile?.show_bio_as_status &&
                profile?.bio ? (
                  <span className="text-primary font-medium">
                    {profile.bio}
                  </span>
                ) : (
                  <>
                    {t("lastSeenSince")}{" "}
                    <span className="text-primary font-medium">
                      {getLastSeen(
                        profile?.updated_at || profile?.created_at,
                        t
                      )}
                    </span>
                  </>
                )}
              </span>
              <span className="w-1 h-1 bg-zinc-600 rounded-full" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="absolute max-md:-bottom-23 -bottom-15 end-8 max-md:end-4 md:end-12 flex gap-2">
          {isOwnProfile ? (
            <>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 border border-white/5 rounded-xl transition-colors backdrop-blur-md"
              >
                <LogOut
                  size={18}
                  className={dir === "rtl" ? "rotate-180" : ""}
                />
                <span className="hidden md:inline">{t("logout")}</span>
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-black font-medium rounded-xl transition-colors shadow-lg shadow-primary/20"
              >
                <Edit2 size={18} />
                <span className="hidden md:inline">{t("editProfile")}</span>
              </button>
            </>
          ) : (
            <>
              {friendStatus === "accepted" ? (
                <button
                  onClick={handleRemoveFriend}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl transition-all shadow-lg font-bold bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
                >
                  <Users size={18} />
                  {t("removeFriend") || "Remove Friend"}
                </button>
              ) : friendStatus === "pending" ? (
                <button
                  onClick={handleCancelRequest}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl transition-all shadow-lg font-bold bg-zinc-800 text-zinc-400 border border-white/5 hover:bg-zinc-700"
                >
                  <Clock size={18} />
                  {t("cancelRequest") || "Cancel Request"}
                </button>
              ) : (
                <button
                  onClick={handleSendFriendRequest}
                  disabled={isSendingRequest}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl transition-all shadow-lg font-bold bg-primary hover:bg-primary-hover text-black shadow-primary/20"
                >
                  <UserPlus size={18} />
                  {t("addFriend")}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        {/* Left Column - Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-primary" />
              {t("seasonStats")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl relative overflow-hidden group">
                <div className="absolute top-2 end-2 text-primary opacity-20 group-hover:opacity-40 transition-opacity">
                  <Crosshair size={32} />
                </div>
                <span className="text-zinc-400 text-xs uppercase tracking-wider">
                  {t("kdRatio")}
                </span>
                <div className="text-2xl font-bold text-white mt-1">2.45</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl relative overflow-hidden group">
                <div className="absolute top-2 end-2 text-primary opacity-20 group-hover:opacity-40 transition-opacity">
                  <Target size={32} />
                </div>
                <span className="text-zinc-400 text-xs uppercase tracking-wider">
                  {t("winRate")}
                </span>
                <div className="text-2xl font-bold text-white mt-1">68%</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <span className="text-zinc-400 text-xs uppercase tracking-wider">
                  {t("matches")}
                </span>
                <div className="text-2xl font-bold text-white mt-1">1,240</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <span className="text-zinc-400 text-xs uppercase tracking-wider">
                  {t("rank")}
                </span>
                <div className="text-lg font-bold text-primary mt-1">
                  Diamond II
                </div>
              </div>
            </div>
          </div> */}

          {/* Friends / Squad */}
          <div className="max-md:mt-8 bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-primary" />
                {t("friends") || "Friends"}
              </h3>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                {friends.length}
              </span>
            </div>

            <div className="space-y-3">
              {loadingFriends ? (
                <div className="py-8 text-center animate-pulse text-zinc-600 italic text-sm">
                  {t("loadingFriends")}
                </div>
              ) : friends.length > 0 ? (
                friends.map((friend, idx) => (
                  <div
                    key={idx}
                    onClick={() => router.push(`/profile/${friend.id}`)}
                    className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={
                          friend.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`
                        }
                        alt={friend.username}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white text-sm truncate">
                          {friend.username}
                        </h4>
                        {friend.is_pro && (
                          <span className="text-[8px] bg-primary text-black px-1 rounded font-black">
                            {t("pro")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">
                        {friend.is_pro &&
                        friend.show_bio_as_status &&
                        friend.bio
                          ? friend.bio
                          : getLastSeen(friend.updated_at, t)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-zinc-500 italic text-sm">
                  {t("noFriendsYet")}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Activity & Games */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Active Rooms */}
          {activeRooms.length > 0 && (
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Gamepad2 size={20} className="text-primary" />
                {t("activeRooms")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => router.push(`/room/${room.id}`)}
                    className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 hover:border-primary/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={room.game_cover_url}
                          alt={room.game_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                            {room.title}
                          </h4>
                          <span className="text-xs text-zinc-500">
                            {room.game_name}
                          </span>
                        </div>
                      </div>
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">
                        {room.member_count}/{room.max_players}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>{room.region}</span>
                      <span>
                        {room.mic_required ? t("micRequired2") : t("noMic")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Played */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              {t("recentlyPlayed")}
            </h3>

            <div className="space-y-4">
              {recentlyPlayed.length > 0 ? (
                recentlyPlayed.map((game, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white group-hover:text-primary transition-colors">
                        {game.title}
                      </h4>
                      <p className="text-sm text-zinc-500">
                        {t("lastPlayed")}{" "}
                        {new Date(game.lastPlayed).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-sm text-center py-4">
                  {t("noRecentGames")}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {t("chooseAvatar")}
              </h3>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                x
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {PRESET_AVATARS.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => handleUpdateProfile({ avatar_url: url })}
                  className="aspect-square rounded-full border-2 border-transparent hover:border-primary cursor-pointer hover:scale-105 transition-all overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`Avatar ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Cover Selection Modal */}
      {isCoverTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {t("chooseCover")}
              </h3>
              <button
                onClick={() => setIsCoverTableOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                x
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto">
              {PRESET_COVERS.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => handleUpdateProfile({ cover_url: url })}
                  className="h-32 rounded-xl border-2 border-transparent hover:border-primary cursor-pointer hover:scale-105 transition-all overflow-hidden relative group"
                >
                  <img
                    src={url}
                    alt={`Cover ${idx}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
