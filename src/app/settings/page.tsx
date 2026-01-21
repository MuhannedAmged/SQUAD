"use client";

import React from "react";
import SettingsPage from "@/components/SettingsPage";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SettingsPageRoute() {
  const { user, handleLogout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">
          Please login to view your settings
        </h2>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2 bg-primary text-black font-bold rounded-xl"
        >
          Go to Login
        </button>
      </div>
    );
  }
  return <SettingsPage />;
}
