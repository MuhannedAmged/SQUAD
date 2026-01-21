"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User, Player } from "@/types";
import { supabase } from "@/lib/supabase";
import { setCookieData, getCookieData, removeCookieData } from "@/lib/cookies";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player | null) => void;
  handleLogin: (email?: string, password?: string) => Promise<void>;
  handleSignUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  handleLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  useEffect(() => {
    // If we have cookie data, set current player early
    const cookieUser = getCookieData();
    if (cookieUser) {
      setUser(cookieUser);
      setCurrentPlayer({
        id: cookieUser.id,
        name: cookieUser.name,
        avatar: cookieUser.avatar,
        isReady: false,
        isHost: false,
      });
    }
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUser(session.user);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUser(session.user);
      } else {
        setUser(null);
        setCurrentPlayer(null);
        removeCookieData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUser = async (sbUser: any) => {
    let mappedUser: User = {
      id: sbUser.id,
      name:
        sbUser.user_metadata?.username ||
        sbUser.email?.split("@")[0] ||
        "Gamer",
      avatar:
        sbUser.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
      level: 1,
      reputation: 100,
    };

    // Fetch latest profile data immediately to ensure avatar is in sync
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, bio, is_pro")
      .eq("id", sbUser.id)
      .single();

    // Fire-and-forget update for Last Seen
    supabase
      .from("profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sbUser.id)
      .then(({ error }) => {
        if (error) console.error("Failed to update last seen:", error);
      });

    if (profile) {
      mappedUser = {
        ...mappedUser,
        name: profile.username || mappedUser.name,
        avatar: profile.avatar_url || mappedUser.avatar,
        bio: profile.bio,
        isPro: profile.is_pro,
      };
    }

    setUser(mappedUser);
    setCookieData(mappedUser);
    setCurrentPlayer({
      id: mappedUser.id,
      name: mappedUser.name,
      avatar: mappedUser.avatar,
      isReady: false,
      isHost: false,
    });
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      // Fetch latest profile data from database
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, bio, is_pro")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error refreshing user:", error);
        return;
      }

      if (profile) {
        const updatedUser: User = {
          ...user,
          name: profile.username || user.name,
          avatar: profile.avatar_url || user.avatar,
          bio: profile.bio,
          isPro: profile.is_pro,
        };

        setUser(updatedUser);
        setCookieData(updatedUser);

        // Update current player as well
        setCurrentPlayer({
          id: updatedUser.id,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          isReady: currentPlayer?.isReady || false,
          isHost: currentPlayer?.isHost || false,
        });
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  const handleLogin = async (email?: string, password?: string) => {
    if (email && password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("Login error:", error.message);
        throw error;
      }
    } else {
      // Fallback for demo if no credentials provided
      const mockUser: User = {
        id: "u1",
        name: "SolGuruz",
        avatar: "https://picsum.photos/id/64/200/200",
        level: 42,
        reputation: 98,
      };
      setUser(mockUser);
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    username: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    if (error) {
      console.error("Signup error:", error.message);
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPlayer(null);
    removeCookieData();
  };

  return (
    <AuthContext.Provider
      value={
        {
          user,
          setUser,
          currentPlayer,
          setCurrentPlayer,
          handleLogin,
          handleLogout,
          handleSignUp,
          refreshUser,
        } as any
      }
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
