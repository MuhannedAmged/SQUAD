"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { ViewType } from "@/types";

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="min-h-screen bg-background text-white font-sans flex relative overflow-hidden">
      {!isAuthPage && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={(pathname.replace("/", "") || "home") as ViewType}
          onNavigate={(view) => router.push(view === "home" ? "/" : `/${view}`)}
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
        {!isAuthPage && (
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            user={user}
            onNavigate={(view) =>
              router.push(view === "home" ? "/" : `/${view}`)
            }
          />
        )}

        <main
          className={`flex-1 ${
            isAuthPage ? "p-0" : "p-4 md:p-8 lg:p-10"
          } max-w-[1600px] mx-auto w-full transition-all duration-300`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
