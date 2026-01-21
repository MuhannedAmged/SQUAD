"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  const { t, dir } = useLanguage();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir={dir}
    >
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500">
            <AlertTriangle size={48} />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">
          {t("pageNotFound")}
        </h1>

        <p className="text-zinc-400 mb-8 leading-relaxed">
          {t("pageNotFoundDesc")}
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover transition-colors"
        >
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
