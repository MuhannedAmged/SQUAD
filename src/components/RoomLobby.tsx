"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Room, Player } from "@/types";
import {
  Mic,
  MicOff,
  MessageSquare,
  Copy,
  Crown,
  LogOut,
  Send,
  CheckCircle2,
  Users,
  Settings,
  UserPlus,
  Loader2,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface RoomLobbyProps {
  room: Room;
  currentUser: Player;
  onLeave: () => void;
  onToggleReady: (ready: boolean) => void;
  onKick?: (userId: string) => void;
  onEditRoom?: () => void;
  onAccept?: (userId: string) => void;
  onJoin?: (message: string) => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  currentUser,
  onLeave,
  onToggleReady,
  onKick,
  onEditRoom,
  onAccept,
  onJoin,
}) => {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const [localPlayers, setLocalPlayers] = useState<Player[]>(room.players);
  const [isReady, setIsReady] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const { messages, sendMessage } = useRealtimeChat(room.id, currentUser.name);
  const { peers } = useVoiceChat(room.id, currentUser.id, isMicMuted);
  const [chatInput, setChatInput] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);

  useEffect(() => {
    setLocalPlayers(room.players);
  }, [room.players]);

  useEffect(() => {
    const channel = supabase.channel(`room:${room.id}:kicks`);

    channel
      .on("broadcast", { event: "PLAYER_KICKED" }, ({ payload }) => {
        const { userId } = payload;

        if (userId === currentUser.id) {
          toast.error(t("kickedFromRoom"));
          router.push("/browse");
        } else {
          setLocalPlayers((prev) => prev.filter((p) => p.id !== userId));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room.id, currentUser.id, router]);

  useEffect(() => {
    if (isInviteModalOpen) {
      fetchFriends();
    }
  }, [isInviteModalOpen]);

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    try {
      // Fetch accepted friends
      const { data: sent, error: sentErr } = await supabase
        .from("friends")
        .select(
          "receiver_id, profiles!receiver_id(id, username, avatar_url, is_pro)"
        )
        .eq("sender_id", currentUser.id)
        .eq("status", "accepted");

      const { data: rcv, error: rcvErr } = await supabase
        .from("friends")
        .select(
          "sender_id, profiles!sender_id(id, username, avatar_url, is_pro)"
        )
        .eq("receiver_id", currentUser.id)
        .eq("status", "accepted");

      if (!sentErr && !rcvErr) {
        const all = [
          ...(sent?.map((f) => f.profiles) || []),
          ...(rcv?.map((f) => f.profiles) || []),
        ].filter((f) => f !== null && f !== undefined);
        setFriends(all);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleInvite = async (friendIds: string[]) => {
    if (friendIds.length === 0) return;
    setIsSendingInvites(true);
    try {
      const invites = friendIds.map((friendId) => ({
        user_id: friendId,
        type: "game_invite",
        title: t("gameInviteTitle") || "Game Invite",
        content: `${currentUser.name} ${
          t("gameInviteContent") || "invited you to their room"
        } "${room.title}"`,
        link: `/room/${room.id}`,
        is_read: false,
      }));

      // Insert into DB
      const { error: dbErr } = await supabase
        .from("notifications")
        .insert(invites);

      if (dbErr) throw dbErr;

      // Broadcast to each friend
      for (const friendId of friendIds) {
        const channel = supabase.channel(`user-notifications:${friendId}`);
        await channel.send({
          type: "broadcast",
          event: "GAME_INVITED",
          payload: {
            senderName: currentUser.name,
            roomTitle: room.title,
            roomId: room.id,
          },
        });
        supabase.removeChannel(channel);
      }

      toast.success(t("invitationSent"));
      setIsInviteModalOpen(false);
      setSelectedFriends([]);
    } catch (err: any) {
      console.error("Invite Error:", err);
      toast.error(`${t("failedToUpdate")}: ${err.message || "Unknown error"}`);
    } finally {
      setIsSendingInvites(false);
    }
  };

  const toggleFriendSelection = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput("");
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t("inviteLinkCopied"));
  };

  const allMessages = [
    { user: "System", text: `${t("welcomeTo")} ${room.title}` },
    ...messages,
  ];

  const handleKickPlayer = async (userId: string) => {
    const channel = supabase.channel(`room:${room.id}:kicks`);
    await channel.send({
      type: "broadcast",
      event: "PLAYER_KICKED",
      payload: { userId, roomId: room.id },
    });

    setLocalPlayers((prev) => prev.filter((p) => p.id !== userId));

    if (onKick) {
      onKick(userId);
    }
  };

  const slots = Array.from({ length: room.maxPlayers }).map(
    (_, i) => localPlayers[i] || null
  );

  return (
    <div className="w-full h-[calc(100vh-140px)] min-h-[600px] grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Player Slots */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Room Header */}
        <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex max-md:flex-col max-md:gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={room.gameImage}
              alt={room.game}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{room.title}</h2>
              <div className="flex items-center gap-3 max-md:gap-1 text-sm text-zinc-500">
                <span className="font-semibold text-primary">{room.game}</span>
                <span>•</span>
                <span>{room.region}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {room.micRequired ? <Mic size={14} /> : <MicOff size={14} />}
                  {room.micRequired ? t("micOn") : t("micOff")}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 max-md:gap-1.5">
            <button
              onClick={copyInviteLink}
              className="p-3 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors"
              title={t("inviteLink")}
            >
              <Copy size={20} />
            </button>

            {/* Mic Toggle */}
            <button
              onClick={() => setIsMicMuted(!isMicMuted)}
              className={`p-3 rounded-xl transition-colors ${
                isMicMuted
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  : "bg-zinc-800 text-zinc-500 hover:text-white"
              }`}
              title={isMicMuted ? t("unmuteMic") : t("muteMic")}
            >
              {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Edit Room (Host Only) */}
            {currentUser.isHost && (
              <button
                onClick={onEditRoom}
                className="p-3 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors"
                title={t("editRoom")}
              >
                <Settings size={20} />
              </button>
            )}

            {/* Invite Friends Button */}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="p-3 bg-zinc-800 rounded-xl text-zinc-500 hover:text-primary transition-colors"
              title={t("inviteFriends")}
            >
              <UserPlus size={20} />
            </button>

            <button
              onClick={onLeave}
              className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500/20 transition-colors"
              title={t("leaveRoom")}
            >
              <LogOut size={20} className={dir === "rtl" ? "rotate-180" : ""} />
            </button>
          </div>
        </div>

        {/* Player Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {slots
            .filter((p) => !p || p.status !== "pending")
            .map((player, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-2xl border-2 flex flex-col items-center justify-center p-6 transition-all ${
                  player
                    ? player.isReady
                      ? "bg-primary/5 border-primary"
                      : "bg-zinc-900 border-zinc-800"
                    : "bg-zinc-900/30 border-dashed border-zinc-800"
                }`}
              >
                {player ? (
                  <>
                    <div className="absolute top-4 right-4">
                      {player.isHost && (
                        <Crown
                          size={20}
                          className="text-yellow-500 fill-yellow-500"
                        />
                      )}
                    </div>

                    <div className="relative">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-20 h-20 rounded-full object-cover mb-4 ring-4 ring-zinc-800"
                      />
                      {player.isReady && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-black rounded-full p-1 ring-4 ring-zinc-900">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-white mb-1">
                      {player.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {player.isReady ? (
                        <span className="text-primary">{t("ready")}</span>
                      ) : (
                        t("notReady")
                      )}
                    </p>

                    {currentUser.isHost && !player.isHost && (
                      <button
                        onClick={() => handleKickPlayer(player.id)}
                        className="mt-4 px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 text-[10px] font-bold rounded-lg transition-all border border-red-500/20 hover:text-white"
                      >
                        {t("kickPlayer")}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-zinc-400 flex flex-col items-center">
                    <Users size={32} className="mb-2 opacity-20" />
                    <span className="text-sm font-medium">
                      {t("waitingForPlayers")}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
        </div>

        {/* Pending Requests (Host Only) */}
        {currentUser.isHost &&
          localPlayers.some((p: any) => p.status === "pending") && (
            <div className="bg-zinc-900 border border-yellow-500/20 p-4 rounded-2xl">
              <h3 className="text-yellow-500 font-bold mb-3 flex items-center gap-2">
                <Users size={18} /> {t("joinRequests")}
              </h3>
              <div className="space-y-2">
                {localPlayers
                  .filter((p: any) => p.status === "pending")
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="font-bold text-white">
                            {player.name}
                          </span>
                        </div>
                        {player.message && (
                          <div className="mt-2 text-sm text-zinc-400 bg-black/20 p-2 rounded italic">
                            "{player.message}"
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onKick?.(player.id)}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                          {t("reject")}
                        </button>
                        <button
                          onClick={() => onAccept?.(player.id)}
                          className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors"
                        >
                          {t("accept")}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Join Request Modal */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {t("requestToJoin")}
              </h3>
              <p className="text-zinc-400 mb-4 text-sm">
                {t("requestJoinDesc")}
              </p>
              <textarea
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder={t("joinMessagePlaceholder")}
                className="w-full bg-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px] mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onJoin?.(joinMessage);
                    setIsJoinModalOpen(false);
                  }}
                  className="px-6 py-2 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover transition-colors"
                >
                  {t("sendRequest")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Action Button: Ready or Join */}
        <div className="mt-auto">
          {currentUser.status === "pending" ? (
            <button
              disabled
              className="w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest bg-zinc-800/50 text-zinc-500 cursor-not-allowed border-2 border-dashed border-zinc-700"
            >
              {t("waitingApproval")}
            </button>
          ) : currentUser.status === "approved" ||
            currentUser.status === "joined" ? (
            <button
              onClick={() => {
                const nextReady = !isReady;
                setIsReady(nextReady);
                onToggleReady(nextReady);
              }}
              className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-lg transform active:scale-95 ${
                isReady
                  ? "bg-zinc-800 text-zinc-500"
                  : "bg-primary text-black shadow-primary/20 hover:bg-primary-hover"
              }`}
            >
              {isReady ? t("notReady") : t("ready")}
            </button>
          ) : (
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest bg-primary text-black shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              {t("requestToJoin")}
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Chat */}
      <div className="h-full min-h-[400px] flex flex-col bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h3 className="font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} /> {t("chat")}
          </h3>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {allMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.user === currentUser.name ? "items-end" : "items-start"
              }`}
            >
              <div className="text-[10px] text-zinc-500 mb-1 px-1">
                {msg.user}
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-sm max-w-[85%] wrap-break-word whitespace-pre-wrap ${
                  msg.user === "System"
                    ? "bg-transparent text-zinc-400 text-center w-full italic"
                    : msg.user === currentUser.name
                    ? "bg-primary text-black rounded-tr-none"
                    : "bg-zinc-800 text-zinc-200 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSend}
          className="p-3 border-t border-white/5 flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t("chatPlaceholder")}
            className="flex-1 bg-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="p-2 bg-primary text-black rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Send size={18} className={dir === "rtl" ? "rotate-180" : ""} />
          </button>
        </form>
      </div>

      {/* Voice Chat Audio Elements */}
      {peers.map((peerId) => (
        <audio
          key={peerId}
          id={`audio-${peerId}`}
          autoPlay
          playsInline // Important for mobile
          style={{ display: "none" }}
        />
      ))}

      {/* Invite Friends Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md p-6 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {t("inviteFriends")}
                </h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar message-list">
                {isLoadingFriends ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <Loader2 className="animate-spin mb-3" size={32} />
                    <p>{t("loadingFriends")}</p>
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => toggleFriendSelection(friend.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                          selectedFriends.includes(friend.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-zinc-800/50 border-white/5 hover:bg-zinc-800"
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={
                              friend.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`
                            }
                            alt={friend.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {selectedFriends.includes(friend.id) && (
                            <div className="absolute -top-1 -right-1 bg-primary text-black rounded-full p-0.5 ring-2 ring-zinc-900">
                              <CheckCircle2 size={12} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">
                            {friend.username}
                          </h4>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                            selectedFriends.includes(friend.id)
                              ? "bg-primary border-primary"
                              : "border-zinc-700"
                          }`}
                        >
                          {selectedFriends.includes(friend.id) && (
                            <CheckCircle2 size={12} className="text-black" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500 italic">
                    {t("noFriendsToInvite")}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleInvite(selectedFriends)}
                    disabled={selectedFriends.length === 0 || isSendingInvites}
                    className="flex-1 py-3 bg-primary text-black font-bold rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                  >
                    {isSendingInvites ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <UserPlus size={20} />
                    )}
                    {t("inviteSelected")}
                  </button>
                </div>
                <button
                  onClick={() => handleInvite(friends.map((f) => f.id))}
                  disabled={friends.length === 0 || isSendingInvites}
                  className="w-full py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Users size={20} />
                  {t("inviteAll")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomLobby;
