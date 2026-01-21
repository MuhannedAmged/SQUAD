"use client";

import React from "react";
import {
  Home,
  Compass,
  PlusCircle,
  User as UserIcon,
  Settings,
  HelpCircle,
  X,
  Gamepad,
  Gamepad2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ViewType, NavItem } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView }) => {
  const { t, dir } = useLanguage();

  const menuItems: NavItem[] = [
    { icon: Home, label: t("home"), view: "home" },
    { icon: Compass, label: t("browseRooms"), view: "browse" },
    { icon: PlusCircle, label: t("createRoom"), view: "create-room" }, // Highlighted action
    { icon: UserIcon, label: t("profile"), view: "profile" },
    { icon: Settings, label: t("settings"), view: "settings" },
  ];

  const handleNavClick = (view: ViewType) => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed lg:sticky top-0 start-0 h-screen w-64 bg-sidebar border-e border-white/5 z-50 flex flex-col justify-between py-6 px-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen
            ? "translate-x-0"
            : dir === "rtl"
            ? "translate-x-full"
            : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center justify-between lg:justify-start gap-3 px-2 mb-10">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleNavClick("home")}
            >
              <div className="w-8 h-8 bg-transparent text-primary">
                <Gamepad2 className="w-full h-full" fill="currentColor" />
              </div>
              <span className="text-2xl font-bold tracking-wide text-white">
                SQUAD.
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = currentView === item.view;
              const isCreate = item.view === "create-room";

              return (
                <Link
                  href={item.view === "home" ? "/" : `/${item.view}`}
                  key={index}
                >
                  <button
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    } ${isCreate ? "text-primary hover:text-primary" : ""}`}
                  >
                    <item.icon
                      size={20}
                      className={`transform ${
                        dir === "rtl" && "scale-x-[-1]"
                      } ${
                        isActive
                          ? "text-white"
                          : isCreate
                          ? "text-primary"
                          : "text-zinc-400 group-hover:text-white"
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-8">
          <Link href="/help">
            <button className="flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors w-full">
              <HelpCircle size={20} />
              <span>{t("help")}</span>
            </button>
          </Link>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
