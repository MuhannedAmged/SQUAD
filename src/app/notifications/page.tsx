"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Trash2,
  CheckCircle,
  Trash,
  Clock,
  UserPlus,
  Gamepad2,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useFriendActions } from "@/hooks/useFriendActions";
export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UUID regex for validation
  const isValidUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  useEffect(() => {
    if (user && isValidUUID(user.id)) {
      fetchNotifications();

      // Realtime subscription
      const channel = supabase
        .channel(`notifications_page_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
            // Optional: toast if page is dedicated? Maybe redundant if Header shows it.
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user || !isValidUUID(user.id)) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    if (!user || !isValidUUID(user.id)) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (!error) {
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    }
  };

  const deleteAll = async () => {
    if (!user || !isValidUUID(user.id)) return;
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (!error) {
      setNotifications([]);
      toast.success("All notifications deleted");
    }
  };

  const deleteOne = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications(notifications.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return UserPlus;
      case "game_invite":
        return Gamepad2;
      default:
        return Info;
    }
  };

  // Handle friend request response (accept/decline)
  const { handleFriendResponse } = useFriendActions();

  const handleResponse = (
    notificationId: string,
    senderId: string,
    action: "accept" | "decline",
  ) => {
    handleFriendResponse(notificationId, senderId, action, () => {
      // Refresh notifications list to remove the request from the list if needed or mark it read locally
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    });
  };

  if (loading)
    return (
      <div className="text-center py-20 animate-pulse">
        {t("loadingNotifications")}
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="text-primary" />
            {t("notifications")}
          </h1>
          <p className="text-zinc-400 mt-1">{t("manageAllNotifications")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-bold text-white rounded-xl transition-all"
          >
            <CheckCircle size={18} />
            {t("markAllRead")}
          </button>
          <button
            onClick={deleteAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-sm font-bold text-red-500 rounded-xl transition-all"
          >
            <Trash2 size={18} />
            {t("deleteAll")}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`bg-zinc-900/50 border ${
                  notif.is_read
                    ? "border-white/5"
                    : "border-primary/20 bg-primary/5"
                } p-6 rounded-2xl flex items-start gap-4 group transition-all`}
              >
                <div
                  className={`p-3 rounded-full bg-zinc-800 ${
                    notif.is_read
                      ? "text-zinc-500"
                      : "text-primary animate-pulse shadow-lg shadow-primary/10"
                  }`}
                >
                  {React.createElement(getIcon(notif.type), { size: 24 })}
                </div>

                <div
                  className="flex-1 min-w-0"
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className={`font-bold text-lg ${
                        notif.is_read ? "text-zinc-300" : "text-white"
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <span className="text-xs text-zinc-500 flex items-center gap-1 shrink-0">
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleDateString()}{" "}
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed max-w-2xl">
                    {notif.content}
                  </p>

                  {notif.link && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(notif.link);
                      }}
                      className="mt-4 text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      {t("viewDetails")}
                    </button>
                  )}

                  {/* Friend Request Actions */}
                  {notif.type === "friend_request" && !notif.is_read && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const senderId = notif.link?.split("/").pop();
                          if (senderId)
                            handleResponse(notif.id, senderId, "accept");
                        }}
                        className="px-4 py-2 bg-primary text-black text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors"
                      >
                        {t("accept")}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const senderId = notif.link?.split("/").pop();
                          if (senderId)
                            handleResponse(notif.id, senderId, "decline");
                        }}
                        className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-colors"
                      >
                        {t("decline")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => deleteOne(notif.id)}
                    className="p-2 bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-zinc-900/50 border border-white/5 p-20 rounded-3xl text-center">
              <Bell
                size={48}
                className="mx-auto mb-4 text-zinc-700 opacity-50"
              />
              <h3 className="text-xl font-bold text-white mb-2">
                {t("inboxEmpty")}
              </h3>
              <p className="text-zinc-500">{t("inboxEmptyDesc")}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
