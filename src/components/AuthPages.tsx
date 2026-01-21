"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Check, ArrowRight, Gamepad2 } from "lucide-react";
import { ViewType } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { loginSchema, signupSchema } from "@/lib/validation";
import { sanitize } from "@/lib/security";

interface AuthPagesProps {
  initialView: "login" | "register";
  onLogin: () => void;
  onNavigate: (view: ViewType) => void;
}

const AuthPages: React.FC<AuthPagesProps> = ({
  initialView,
  onLogin,
  onNavigate,
}) => {
  const [isLogin, setIsLogin] = useState(initialView === "login");
  const { t, dir } = useLanguage();
  const { handleLogin, handleSignUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Success state for signup
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [counter, setCounter] = useState(10);

  // Timer effect
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (signupSuccess && counter > 0) {
      timer = setInterval(() => setCounter((c) => c - 1), 1000);
    } else if (signupSuccess && counter === 0) {
      setSignupSuccess(false);
      setIsLogin(true); // Switch to login view
      setError("");
    }
    return () => clearInterval(timer);
  }, [signupSuccess, counter]);

  const toggleView = () => {
    setIsLogin(!isLogin);
    setError("");
    setSignupSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Validation with Zod
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          throw new Error(result.error.issues[0].message);
        }
        await handleLogin(email, password);
        onLogin(); // Proceed to app
      } else {
        // Validation with Zod
        const result = signupSchema.safeParse({ email, password, username });
        if (!result.success) {
          throw new Error(result.error.issues[0].message);
        }
        // Sanitization
        const sanitizedUsername = sanitize(username);
        await handleSignUp(email, password, sanitizedUsername);
        toast.success(t("checkEmail"));
        setSignupSuccess(true);
        // Do NOT call onLogin() here, wait for verification
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-full w-full flex items-center justify-center p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          {signupSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {t("checkEmail")}
              </h2>
              <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
                {t("sentLinkTo")} <strong>{email}</strong>.{" "}
                {t("verifyToContinue")}
              </p>

              <div className="bg-zinc-800/50 rounded-xl p-4 inline-block mb-6">
                <p className="text-sm text-zinc-500 mb-1">
                  {t("redirectingLogin")}
                </p>
                <div className="text-2xl font-bold text-white font-mono">
                  {counter}s
                </div>
              </div>

              <button
                onClick={() => {
                  setSignupSuccess(false);
                  setIsLogin(true);
                  setError("");
                }}
                className="block w-full text-primary hover:underline text-sm font-bold"
              >
                {t("goToLogin")}
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4">
                  <Gamepad2 size={28} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? t("welcomeBack") : t("createAccount")}
                </h2>
                <p className="text-zinc-400">
                  {isLogin ? t("enterCredentials") : t("joinCommunity")}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="relative">
                        <User
                          className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-500"
                          size={20}
                        />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={t("username")}
                          className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-3.5 ps-12 pe-4 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail
                    className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={20}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("email")}
                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-3.5 ps-12 pe-4 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock
                    className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={20}
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("password")}
                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-3.5 ps-12 pe-4 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:transform-none"
                >
                  {isLoading
                    ? t("loading")
                    : isLogin
                    ? t("signIn")
                    : t("createAccount")}
                  <ArrowRight
                    size={20}
                    className={dir === "rtl" ? "rotate-180" : ""}
                  />
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-zinc-400">
                  {isLogin ? t("noAccount") : t("haveAccount")}
                  <button
                    onClick={toggleView}
                    className="mx-2 text-primary hover:underline font-medium"
                  >
                    {isLogin ? t("signup") : t("login")}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right Side - Image/Decor */}
        <div className="hidden md:block w-1/2 relative bg-zinc-800">
          <div className="absolute inset-0">
            <img
              src={
                isLogin
                  ? "https://picsum.photos/id/1050/800/1200"
                  : "https://picsum.photos/id/1055/800/1200"
              }
              alt="Gaming Background"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-linear-to-l from-zinc-900 via-zinc-900/60 to-transparent" />
            <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
          </div>

          <div className="absolute bottom-12 end-12 text-end max-w-xs z-10">
            <h3 className="text-3xl font-bold text-white mb-4">
              {isLogin ? t("levelUp") : t("joinSquad")}
            </h3>
            <p className="text-zinc-300">{t("discoverWorlds")}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPages;
