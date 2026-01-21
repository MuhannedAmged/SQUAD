"use client";

import CreateRoom from "@/components/CreateRoom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTranslate } from "@/hooks/useTranslate";
import { toast } from "sonner";

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslate();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-3xl font-bold text-white mb-4">
          {t("accessDenied" as any)}
        </h2>
        <p className="text-zinc-400 mb-8 text-lg">{t("mustLogin" as any)}</p>
        <button
          onClick={() => router.push("/login")}
          className="px-8 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover transition-colors"
        >
          {t("goToLogin" as any)}
        </button>
      </div>
    );
  }

  const handleCreate = async (data: any) => {
    if (!user) {
      toast.warning(t("login"));
      return;
    }

    // Check room limits
    const { count, error: countError } = await supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id);

    if (countError) {
      console.error("Error checking room limits:", countError);
    } else {
      const limit = user.isPro ? 10 : 3;
      if (count !== null && count >= limit) {
        toast.error(
          `Room limit reached! ${
            user.isPro ? "Pro" : "Standard"
          } accounts are limited to ${limit} rooms.`
        );
        return;
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const { data: room, error } = await supabase
      .from("rooms")
      .insert([
        {
          ...data,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          language: "en",
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room: " + error.message);
      return;
    }

    // Join the creator as the first member
    const { error: memberError } = await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
      is_host: true,
      is_ready: true,
    });

    if (memberError) {
      console.error("Error joining room as host:", memberError);
      toast.error(
        "Room created but failed to join. Please try joining from browse."
      );
      router.push("/browse");
      return;
    }

    toast.success("Room created successfully!");
    router.push(`/room/${room.id}`);
  };

  return (
    <div className="flex justify-center items-center">
      <CreateRoom
        onCancel={() => router.push("/")}
        onCreate={handleCreate}
        isPro={user?.isPro}
      />
    </div>
  );
}
