"use client";

import React from "react";
import AuthPages from "@/components/AuthPages";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { handleLogin } = useAuth();
  const router = useRouter();

  const onSuccess = () => {
    handleLogin();
    router.push("/");
  };

  return (
    <AuthPages
      initialView="login"
      onLogin={onSuccess}
      onNavigate={(view) => router.push(`/${view}`)}
    />
  );
}
