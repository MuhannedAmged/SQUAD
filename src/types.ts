import React from "react";

export type ViewType =
  | "home"
  | "browse"
  | "create-room"
  | "room-lobby"
  | "login"
  | "register"
  | "profile"
  | "settings"
  | "help";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
  level?: number;
  status?: "pending" | "approved" | "rejected" | "joined";
  message?: string;
}

export interface Room {
  id: string;
  title: string;
  game: string;
  gameImage: string;
  host: Player;
  players: Player[];
  maxPlayers: number;
  tags: string[];
  language: string;
  micRequired: boolean;
  status: "open" | "full" | "playing";
  region?: string;
  ping?: number;
}

export interface NavItem {
  icon: React.ElementType;
  label: string;
  view: ViewType;
  active?: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  level: number;
  reputation: number; // New: Social trust score
  bio?: string;
  isPro?: boolean;
}

export interface Game {
  id: string | number;
  title: string;
  subtitle?: string;
  image: string;
  price?: string;
  tag?: string;
  description?: string;
}
