"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronDown,
  Shield,
  Zap,
  Users,
  HelpCircle,
  FileText,
  Video,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const HelpPage = () => {
  const { t, dir } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pb-24" dir={dir}>
      {/* Hero Section with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent">
          {t("helpTitle")}
        </h1>
        <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
          {t("supportDesc")}
        </p>

        {/* Enhanced Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search
            className="absolute start-5 top-1/2 -translate-y-1/2 text-zinc-500"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("helpSearchPlaceholder")}
            className="w-full bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl py-5 ps-14 pe-5 text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xl"
          />
        </div>
      </motion.div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {[
          {
            icon: Book,
            title: t("guideTitle"),
            desc: t("guideDesc"),
            color: "from-blue-500/20 to-blue-600/5",
            iconColor: "text-blue-500",
            borderColor: "border-blue-500/20",
          },
          {
            icon: Users,
            title: t("communityTitle"),
            desc: t("communityDesc"),
            color: "from-primary/20 to-primary/5",
            iconColor: "text-primary",
            borderColor: "border-primary/20",
          },
          {
            icon: Shield,
            title: t("safetyTitle"),
            desc: t("safetyDesc"),
            color: "from-red-500/20 to-red-600/5",
            iconColor: "text-red-500",
            borderColor: "border-red-500/20",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative bg-gradient-to-br ${item.color} border ${item.borderColor} rounded-3xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <item.icon
              className={`mb-6 ${item.iconColor} group-hover:scale-110 transition-transform`}
              size={40}
            />
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              {item.desc}
            </p>
            <div className="flex items-center gap-2 text-primary text-sm font-bold">
              {t("viewAll")}{" "}
              <ChevronDown className="rotate-[-90deg]" size={16} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive FAQ Section */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl">
            <HelpCircle className="text-primary" size={28} />
          </div>
          <h2 className="text-3xl font-bold text-white">{t("faqTitle")}</h2>
        </div>

        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === idx ? null : idx)
                  }
                  className="w-full flex items-center justify-between p-6 text-start group"
                >
                  <h4 className="font-bold text-white text-lg group-hover:text-primary transition-colors pr-4">
                    {faq.q}
                  </h4>
                  <motion.div
                    animate={{ rotate: expandedFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="text-zinc-500 shrink-0" size={24} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <div className="border-t border-white/5 pt-4">
                          <p className="text-zinc-400 leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-500">
              {t("search")} "{searchQuery}" - {t("loading")}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-10 md:p-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_50%)]" />
        <div className="relative z-10">
          <div className="inline-block p-4 bg-primary/20 rounded-2xl mb-6">
            <MessageCircle className="text-primary" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("stillNeedHelp")}
          </h2>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            {t("supportDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-primary hover:bg-primary-hover text-black font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105">
              <span className="flex items-center gap-2 justify-center">
                <Mail size={20} />
                {t("contactSupport")}
              </span>
            </button>
            <button className="group bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/10 hover:border-primary/50 hover:scale-105">
              <span className="flex items-center gap-2 justify-center">
                <Users size={20} />
                {t("joinDiscord")}
                <ExternalLink size={16} className="opacity-50" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <a
            href="#"
            className="hover:text-primary transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            {t("privacyPolicy")}
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            {t("termsOfService")}
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            {t("cookiePolicy")}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">{t("poweredBy")}</span>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
