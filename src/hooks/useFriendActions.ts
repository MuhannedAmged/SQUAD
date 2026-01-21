import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const useFriendActions = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFriendResponse = async (
    notificationId: string,
    senderId: string,
    action: "accept" | "decline",
    onSuccess?: () => void
  ) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // 1. Fetch the actual friend request status from the DB
      // We look for a record where sender is the senderId and receiver is the current user
      const { data: request, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .match({ sender_id: senderId, receiver_id: user.id })
        .single();

      if (fetchError || !request) {
        toast.error("Friend request not found");
        // Optional: Delete notification if request is missing?
        // For now, let's just mark it read so it doesn't stuck
        await markNotificationRead(notificationId);
        return;
      }

      // 2. Strict Validation using "status"
      if (request.status !== "pending") {
        toast.error(`Request is no longer valid (Status: ${request.status})`);

        // If it was canceled, we should probably hide the notification
        await markNotificationRead(notificationId);
        onSuccess?.(); // Trigger UI refresh to remove item
        return;
      }

      // 3. Update status based on action
      const newStatus = action === "accept" ? "accepted" : "rejected";

      const { error: updateError } = await supabase
        .from("friends")
        .update({ status: newStatus })
        .match({ sender_id: senderId, receiver_id: user.id });

      if (updateError) {
        throw updateError;
      }

      toast.success(
        action === "accept"
          ? "Friend request accepted!"
          : "Friend request declined"
      );

      // 4. Mark notification as read
      await markNotificationRead(notificationId);
      onSuccess?.();
    } catch (err: any) {
      console.error("Error handling friend request:", err);
      toast.error("Failed to process request");
    } finally {
      setIsProcessing(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  return {
    handleFriendResponse,
    isProcessing,
  };
};
