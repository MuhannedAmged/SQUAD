"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  Menu,
  X,
  Check,
  Gamepad2,
  UserPlus,
  Info,
  Clock,
  TrendingUp,
} from "lucide-react";
import { User, ViewType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { useFriendActions } from "@/hooks/useFriendActions";
import { getLastSeen } from "@/lib/utils";
interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
  onNavigate: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user, onNavigate }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { t, dir } = useLanguage();

  // Close notifications and search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  const addToRecentSearches = (profile: any) => {
    const newItem = {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      level: profile.level,
      is_pro: profile.is_pro,
      bio: profile.bio,
      show_bio_as_status: profile.show_bio_as_status,
      updated_at: profile.updated_at,
    };

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.id !== profile.id);
      const newRecent = [newItem, ...filtered].slice(0, 5);
      localStorage.setItem("recent_searches", JSON.stringify(newRecent));
      return newRecent;
    });
  };

  const removeFromRecentSearches = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const newRecent = prev.filter((item) => item.id !== id);
      localStorage.setItem("recent_searches", JSON.stringify(newRecent));
      return newRecent;
    });
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev].slice(0, 10));
          toast.info(payload.new.title, { description: payload.new.content });
        }
      )
      .subscribe();

    // Listen for room join broadcasts (Ephemeral)
    const broadcastChannel = supabase
      .channel(`user-notifications:${user.id}`)
      .on("broadcast", { event: "ROOM_JOINED" }, ({ payload }) => {
        toast.info(
          `${payload.joinedUserName} ${t("joinedYourRoom")} "${
            payload.roomTitle
          }"`,
          {
            description: t("newPlayerInLobby"),
            action: {
              label: t("view"),
              onClick: () => onNavigate(`room/${payload.roomId}` as any),
            },
          }
        );
      })
      .on("broadcast", { event: "GAME_INVITED" }, ({ payload }) => {
        toast.info(t("gameInviteTitle"), {
          description: `${payload.senderName} ${t("gameInviteContent")} "${
            payload.roomTitle
          }"`,
          action: {
            label: t("join"),
            onClick: () => onNavigate(`room/${payload.roomId}` as any),
          },
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  // Handle friend request response (accept/decline)
  const { handleFriendResponse } = useFriendActions();

  const handleResponse = (
    notificationId: string,
    senderId: string,
    action: "accept" | "decline"
  ) => {
    handleFriendResponse(notificationId, senderId, action, () => {
      // Optional: Specific post-action logic for header if needed,
      // like removing specific notification from state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/profiles/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return UserPlus;
      case "game_invite":
        return Gamepad2;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "friend_request":
        return "text-green-500";
      case "game_invite":
        return "text-primary";
      default:
        return "text-blue-500";
    }
  };

  const trendingGames = [
    "Call of Duty",
    "Fortnite",
    "League of Legends",
    "Minecraft",
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-2 bg-background/80 backdrop-blur-md border-b border-white/5 transition-colors">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Mobile Logo */}
        <div
          className="flex lg:hidden items-center gap-2 cursor-pointer"
          onClick={() => onNavigate("home")}
        >
          <div className="w-5 h-5 text-primary">
            <Gamepad2 className="w-full h-full" fill="currentColor" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            SQUAD.
          </span>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-2.5 bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white rounded-xl transition-all"
        >
          <Search size={20} />
        </button>

        <motion.div
          ref={searchRef}
          className="relative w-full hidden sm:block"
          initial={false}
          animate={{
            maxWidth: isSearchFocused ? "800px" : "448px",
            zIndex: isSearchFocused ? 50 : 1,
          }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
        >
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
            <Search size={18} className="text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-8/12 ps-10 pe-4 py-2.5 bg-zinc-800/50 border border-white/5 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-zinc-800 transition-all shadow-lg"
            onFocus={() => setIsSearchFocused(true)}
          />

          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 w-full bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-2">
                  {searchQuery.trim().length < 2 ? (
                    <>
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                          {t("recent")}
                        </h3>
                        {recentSearches.length > 0 ? (
                          recentSearches.map((profile) => (
                            <div
                              key={profile.id}
                              onClick={() => {
                                onNavigate(`profile/${profile.id}` as any);
                                setIsSearchFocused(false);
                                addToRecentSearches(profile);
                              }}
                              className="flex items-center gap-3 py-2 text-sm cursor-pointer hover:bg-white/5 rounded-xl px-3 -mx-2 group"
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-primary transition-colors">
                                <img
                                  src={
                                    profile.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`
                                  }
                                  alt={profile.username}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-300 font-bold group-hover:text-primary transition-colors">
                                    {profile.username}
                                  </span>
                                </div>
                                <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                                  {profile.is_pro &&
                                  profile.show_bio_as_status &&
                                  profile.bio
                                    ? profile.bio
                                    : getLastSeen(profile.updated_at, t)}
                                </div>
                              </div>
                              <button
                                onClick={(e) =>
                                  removeFromRecentSearches(profile.id, e)
                                }
                                className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-500 text-xs italic py-2">
                            {t("noRecentSearches")}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/5 my-1"></div>

                      <div className="px-4 py-2">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                          {t("trending")}
                        </h3>
                        {trendingGames.map((item, idx) => (
                          <Link href={"/browse"} key={idx}>
                            <div className="flex items-center gap-3 py-2 text-sm cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 group">
                              <TrendingUp size={16} className="text-primary" />
                              <span className="text-zinc-300 group-hover:text-primary transition-colors">
                                {item}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                        {isSearching ? t("searching") : t("players")}
                      </h3>
                      <div className="space-y-2">
                        {searchResults.length > 0
                          ? searchResults.map((profile) => (
                              <div
                                key={profile.id}
                                onClick={() => {
                                  onNavigate(`profile/${profile.id}` as any);
                                  setIsSearchFocused(false);
                                  setSearchQuery("");
                                  addToRecentSearches(profile);
                                }}
                                className="flex items-center gap-3 py-2 text-sm cursor-pointer hover:bg-white/5 rounded-xl px-3 -mx-2 border border-transparent hover:border-white/5 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-primary transition-colors">
                                  <img
                                    src={
                                      profile.avatar_url ||
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`
                                    }
                                    alt={profile.username}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-bold group-hover:text-primary transition-colors">
                                      {profile.username}
                                    </span>
                                    {profile.is_pro && (
                                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black">
                                        PRO
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                                    {profile.is_pro &&
                                    profile.show_bio_as_status &&
                                    profile.bio
                                      ? profile.bio
                                      : getLastSeen(profile.updated_at, t)}
                                  </span>
                                </div>
                                <UserPlus
                                  size={16}
                                  className="text-zinc-500 group-hover:text-primary transition-colors"
                                />
                              </div>
                            ))
                          : !isSearching && (
                              <div className="py-8 text-center text-zinc-500">
                                <Bell
                                  size={32}
                                  className="mx-auto mb-3 opacity-20"
                                />
                                <p className="text-sm">{t("noPlayersFound")}</p>
                              </div>
                            )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative group p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              showNotifications
                ? "bg-zinc-700 text-white border-white/10"
                : "bg-zinc-800/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700"
            }`}
            aria-label="Notifications"
          >
            <Bell
              size={20}
              className="transition-transform group-hover:scale-110"
            />
            {notifications.some((n) => !n.is_read) && (
              <span className="absolute top-2.5 end-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-zinc-800"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`${
                  dir === "rtl"
                    ? "max-md:-translate-x-14.5"
                    : "max-md:translate-x-14.5"
                } absolute top-full mt-3 end-0 w-80 md:w-96 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right`}
                style={{
                  right: dir === "rtl" ? "auto" : 0,
                  left: dir === "rtl" ? 0 : "auto",
                }}
              >
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                  <h3 className="font-bold text-white">{t("notifications")}</h3>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    <Check size={14} /> {t("markAllRead")}
                  </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.link)
                            onNavigate(notif.link.replace("/", "") as any);
                        }}
                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-4 ${
                          !notif.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 ${getNotificationColor(
                            notif.type
                          )}`}
                        >
                          {React.createElement(
                            getNotificationIcon(notif.type),
                            { size: 20 }
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-white">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(notif.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {notif.content}
                          </p>

                          {/* Friend Request Actions */}
                          {notif.type === "friend_request" &&
                            !notif.is_read && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Extract sender ID from link: /profile/UID
                                    const senderId = notif.link
                                      .split("/")
                                      .pop();
                                    handleFriendResponse(
                                      notif.id,
                                      senderId,
                                      "accept"
                                    );
                                  }}
                                  className="px-3 py-1 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors"
                                >
                                  {t("accept")}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const senderId = notif.link
                                      .split("/")
                                      .pop();
                                    handleFriendResponse(
                                      notif.id,
                                      senderId,
                                      "decline"
                                    );
                                  }}
                                  className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                                >
                                  {t("decline")}
                                </button>
                              </div>
                            )}
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-zinc-500">
                      <Bell size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{t("noNewNotifications")}</p>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-white/5 bg-zinc-900">
                  <button
                    onClick={() => {
                      onNavigate("notifications" as any);
                      setShowNotifications(false);
                    }}
                    className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors font-medium"
                  >
                    {t("viewAll")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {user ? (
          <div
            className="flex items-center gap-2 md:gap-3 ps-3 md:ps-6 border-s border-white/10 cursor-pointer group"
            onClick={() => onNavigate("profile")}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary transition-colors">
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold text-white leading-none group-hover:text-primary transition-colors">
                {user.name}
              </span>
              {user.isPro && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-1 w-fit">
                  {t("proPass")}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="ps-3 md:ps-6 border-s border-white/10 flex gap-2 md:gap-3">
            <button
              onClick={() => onNavigate("login")}
              className="max-md:text-sm font-medium text-white hover:text-primary transition-colors"
            >
              {t("login")}
            </button>
            {/* <button
              onClick={() => onNavigate("register")}
              className="px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-primary transition-colors"
            >
              {t("signup")}
            </button> */}
          </div>
        )}
      </div>

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-100 bg-zinc-950 flex flex-col sm:hidden"
          >
            {/* Modal Header */}
            <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-zinc-900/50">
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X size={24} />
              </button>
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  autoFocus
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 text-base"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 h-[400px] w-full absolute top-[70px] bg-zinc-900 ">
              {searchQuery.trim().length < 2 ? (
                <div className="space-y-6">
                  {recentSearches.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock size={14} />
                        {t("recent")}
                      </h3>
                      <div className="space-y-1">
                        {recentSearches.map((profile) => (
                          <div
                            key={profile.id}
                            onClick={() => {
                              onNavigate(`profile/${profile.id}` as any);
                              setIsMobileSearchOpen(false);
                              addToRecentSearches(profile);
                            }}
                            className="flex items-center gap-3 p-3 text-sm hover:bg-white/5 rounded-2xl group transition-all"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                              <img
                                src={
                                  profile.avatar_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`
                                }
                                alt={profile.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-bold">
                                {profile.username}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {profile.is_pro &&
                                profile.show_bio_as_status &&
                                profile.bio
                                  ? profile.bio
                                  : getLastSeen(profile.updated_at, t)}
                              </div>
                            </div>
                            <button
                              onClick={(e) =>
                                removeFromRecentSearches(profile.id, e)
                              }
                              className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp size={14} />
                      {t("trending")}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {trendingGames.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onNavigate("browse");
                            setIsMobileSearchOpen(false);
                          }}
                          className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                        >
                          <TrendingUp size={14} className="text-primary" />
                          <span className="text-sm text-zinc-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    {isSearching ? t("searching") : t("players")}
                  </h3>
                  <div className="space-y-2">
                    {searchResults.length > 0
                      ? searchResults.map((profile) => (
                          <div
                            key={profile.id}
                            onClick={() => {
                              onNavigate(`profile/${profile.id}` as any);
                              setIsMobileSearchOpen(false);
                              setSearchQuery("");
                              addToRecentSearches(profile);
                            }}
                            className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 hover:border-primary/20 rounded-2xl transition-all"
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shrink-0">
                              <img
                                src={
                                  profile.avatar_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`
                                }
                                alt={profile.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-white font-bold truncate">
                                  {profile.username}
                                </span>
                                {profile.is_pro && (
                                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black shrink-0">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500 truncate">
                                {profile.is_pro &&
                                profile.show_bio_as_status &&
                                profile.bio
                                  ? profile.bio
                                  : getLastSeen(profile.updated_at, t)}
                              </div>
                            </div>
                            <UserPlus size={20} className="text-primary" />
                          </div>
                        ))
                      : !isSearching && (
                          <div className="py-12 text-center text-zinc-500">
                            <Search
                              size={48}
                              className="mx-auto mb-4 opacity-20"
                            />
                            <p className="text-sm">
                              {t("noResults")} "{searchQuery}"
                            </p>
                          </div>
                        )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
