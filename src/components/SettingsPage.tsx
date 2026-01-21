"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  Shield,
  Monitor,
  Mail,
  Key,
  Languages,
  LogOut,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { profileSchema } from "@/lib/validation";
import { sanitize } from "@/lib/security";

const SettingsPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { t, language, setLanguage, dir } = useLanguage();
  const { user } = useAuth(); // Note: user.email might be stale or from cookie, best to rely on supabase.auth.getUser() for critical ops

  // Profile State
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [showBioAsStatus, setShowBioAsStatus] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Modals State
  const [modalType, setModalType] = useState<
    "password" | "email" | "delete" | null
  >(null);

  // Sensitive Actions State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setUsername(user.name || "");
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const {
      data: { user: sbUser },
    } = await supabase.auth.getUser();
    if (sbUser?.email) {
      setCurrentEmail(sbUser.email);
    }
    const { data } = await supabase
      .from("profiles")
      .select("bio, show_bio_as_status")
      .eq("id", user?.id)
      .single();
    if (data) {
      setBio(data.bio || "");
      setShowBioAsStatus(data.show_bio_as_status || false);
    }
  };

  const reauthenticate = async (password: string) => {
    if (!currentEmail) return false;
    const { error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password,
    });
    if (error) {
      toast.error(t("incorrectPassword"));
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const result = profileSchema.safeParse({ username, bio });
      if (!result.success) throw new Error(result.error.issues[0].message);

      const { error } = await supabase
        .from("profiles")
        .update({
          username: sanitize(username),
          bio: sanitize(bio),
          show_bio_as_status: showBioAsStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success(t("profileUpdated"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Auto-save bio status toggle (for Pro users)
  const handleToggleBioStatus = async () => {
    if (!user) return;
    const newValue = !showBioAsStatus;
    setShowBioAsStatus(newValue); // Optimistic update

    const { error } = await supabase
      .from("profiles")
      .update({ show_bio_as_status: newValue })
      .eq("id", user.id);

    if (error) {
      setShowBioAsStatus(!newValue); // Revert on failure
      toast.error(t("failedToUpdate"));
    } else {
      toast.success(t("profileUpdated"));
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    setIsLoadingAuth(true);
    // 1. Re-auth with old password
    const verified = await reauthenticate(oldPassword);
    if (!verified) {
      setIsLoadingAuth(false);
      return;
    }

    // 2. Update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoadingAuth(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("passwordUpdated"));
      closeModal();
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error(t("invalidEmail"));
      return;
    }
    setIsLoadingAuth(true);
    const verified = await reauthenticate(oldPassword);
    if (!verified) {
      setIsLoadingAuth(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setIsLoadingAuth(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("emailUpdateSent"));
      closeModal();
      setCurrentEmail(newEmail); // Optimistic update, though real update needs confirmation
    }
  };

  const handleDeleteAccount = async () => {
    if (!oldPassword) {
      toast.error(t("incorrectPassword"));
      return;
    }

    if (
      !confirm(
        t("confirmDeleteAccount") ||
          "Are you sure you want to permanently delete your account? This cannot be undone."
      )
    ) {
      return;
    }

    setIsLoadingAuth(true);
    try {
      const response = await fetch("/api/auth/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: oldPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success(t("accountDeleted"));
      // Force logout
      await supabase.auth.signOut();
      window.location.href = "/login"; // Force full reload to clear states
    } catch (err: any) {
      console.error("Delete account error:", err);
      toast.error(err.message);
    } finally {
      setIsLoadingAuth(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setOldPassword("");
    setNewPassword("");
    setNewEmail("");
  };

  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">{t("settings")}</h1>
        <p className="text-zinc-400">{t("settingsSubtitle")}</p>
      </div>

      <div className="space-y-6">
        {/* 1. Account Info Section */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <UserIcon size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">{t("profileInfo")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                {t("username")}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                {t("bio")}
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
            >
              {isSavingProfile ? t("loading") : t("saveChanges")}
            </button>
          </div>
        </section>

        {/* 2. Security Section */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Shield size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">{t("security")}</h2>
          </div>

          <div className="space-y-4">
            {/* Email Row */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
                  <Mail size={18} className="text-zinc-400" />
                </div>
                <div>
                  <div className="font-medium max-md:text-sm text-white">
                    {t("email")}
                  </div>
                  <div className="text-sm max-md:text-xs text-zinc-500 truncate max-md:max-w-20">
                    {currentEmail || t("hidden")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModalType("email")}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold rounded-lg transition-colors"
                disabled={!currentEmail}
              >
                {t("change")}
              </button>
            </div>

            {/* Password Row */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
                  <Key size={18} className="text-zinc-400" />
                </div>
                <div>
                  <div className="font-medium text-white max-md:text-sm">
                    {t("password")}
                  </div>
                  <div className="text-sm  max-md:text-xs text-zinc-500">
                    {t("lastChangedRecently")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModalType("password")}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                {t("update")}
              </button>
            </div>
          </div>
        </section>

        {/* 3. Preferences Section */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Monitor size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">{t("preferences")}</h2>
          </div>

          {/* Language Row */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
                <Languages size={18} className="text-zinc-400" />
              </div>
              <div>
                <div className="font-medium text-white">{t("language")}</div>
                <div className="text-sm text-zinc-500">
                  {t("selectLanguage")}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  language === "en"
                    ? "bg-primary text-black"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  language === "ar"
                    ? "bg-primary text-black"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                AR
              </button>
            </div>
          </div>

          {/* Show Bio Row (Pro Only) */}
          {user?.isPro && (
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
                  <UserIcon size={18} className="text-zinc-400" />
                </div>
                <div>
                  <div className="font-medium max-md:text-sm text-white">
                    {t("showBioAsStatus")}
                  </div>
                  <div className="text-sm max-md:text-xs text-zinc-500 truncate max-md:max-w-20">
                    {t("showBioAsStatusDesc")}
                  </div>
                </div>
              </div>
              <button
                onClick={handleToggleBioStatus}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  showBioAsStatus ? "bg-primary" : "bg-zinc-700"
                }`}
                dir="ltr"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showBioAsStatus ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
        </section>

        {/* 4. Danger Zone */}
        <section className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 size={24} className="text-red-500" />
            <h2 className="text-xl font-bold text-red-500">
              {t("dangerZone")}
            </h2>
          </div>
          <p className="text-zinc-400 text-sm mb-6 max-w-lg">
            {t("dangerZoneDesc")}
          </p>
          <button
            onClick={() => setModalType("delete")}
            className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
          >
            <LogOut size={18} />
            {t("deleteAccount")}
          </button>
        </section>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                ✕
              </button>

              <h3 className="text-2xl font-bold text-white mb-2">
                {modalType === "password" && t("changePassword")}
                {modalType === "email" && t("changeEmail")}
                {modalType === "delete" && t("deleteAccount")}
              </h3>
              <p className="text-zinc-400 text-sm mb-6">
                {modalType === "delete"
                  ? t("dangerZoneDesc")
                  : t("settingsSubtitle")}
              </p>

              <div className="space-y-4">
                {(modalType === "password" ||
                  modalType === "delete" ||
                  modalType === "email") && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      {modalType === "delete"
                        ? t("confirmPassword")
                        : t("oldPassword")}
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:outline-none"
                      placeholder={t("enterPassword")}
                    />
                  </div>
                )}

                {modalType === "password" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      {t("newPassword")}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:outline-none"
                      placeholder="At least 6 characters"
                    />
                  </div>
                )}

                {modalType === "email" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      {t("newEmail")}
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:outline-none"
                      placeholder="new@example.com"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={() => {
                      if (modalType === "password") handleChangePassword();
                      if (modalType === "email") handleChangeEmail();
                      if (modalType === "delete") handleDeleteAccount();
                    }}
                    disabled={isLoadingAuth}
                    className={`flex-1 py-3 font-bold rounded-xl transition-colors disabled:opacity-50 ${
                      modalType === "delete"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-primary hover:bg-primary-hover text-black"
                    }`}
                  >
                    {isLoadingAuth
                      ? t("processing")
                      : modalType === "delete"
                      ? t("deleteAccount")
                      : t("confirm")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
