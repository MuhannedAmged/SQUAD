"use client";

import React from "react";
import ProfilePage from "@/components/ProfilePage";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";

export default function TargetProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">
          Please login to view profiles
        </h2>
      </div>
    );
  }

  return <ProfilePage user={user} targetUserId={id} />;
}
