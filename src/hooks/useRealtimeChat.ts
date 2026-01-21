"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeChat(roomId: string, currentUsername: string) {
  const [messages, setMessages] = useState<{ user: string; text: string }[]>(
    []
  );

  useEffect(() => {
    if (!roomId) return;

    // Create a channel for the room
    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { self: true }, // receive own messages
      },
    });

    // Listen for messages
    channel
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload]);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Connected to room ${roomId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = useCallback(
    (text: string) => {
      const payload = { user: currentUsername, text };

      // Broadcast the message to the channel
      supabase.channel(`room_${roomId}`).send({
        type: "broadcast",
        event: "chat",
        payload,
      });
    },
    [roomId, currentUsername]
  );

  return { messages, sendMessage };
}
