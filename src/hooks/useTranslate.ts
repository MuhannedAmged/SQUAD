"use client";

import { useLanguage } from "@/context/LanguageContext";

export function useTranslate() {
  const { t, language, setLanguage, dir } = useLanguage();
  return { t, language, setLanguage, dir };
}
