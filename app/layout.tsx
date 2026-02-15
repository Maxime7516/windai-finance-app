"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, Star, MessageSquare, Settings, FileText } from "lucide-react";
import "./globals.css";

const menuI18n = {
  fr: {
    ia: "Analyse IA",
    history: "Historique",
    rating: "Notation",
    comments: "Commentaires",
    reporting: "Reporting",
    settings: "Paramètres"
  },
  en: {
    ia: "AI Analysis",
    history: "History",
    rating: "Rating",
    comments: "Comments",
    reporting: "Reporting",
    settings: "Settings"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState("fr");
  const pathname = usePathname();

  useEffect(() => {
    const savedLang = typeof window !== "undefined" ? localStorage.getItem("language") || "fr" : "fr";
    setLang(savedLang);
  }, []);

  const t = menuI18n[lang as "fr" | "en"] || menuI18n.fr;

  return (
    <html lang={lang}>
      <body className="flex min-h-screen antialiased font-sans bg-slate-50 text-slate-900">
        {/* SIDEBAR */}
        <nav className="w-64 h-screen bg-white border-r border-slate-200 p-6 flex flex-col fixed left-0 top-0 z-50">
          <div className="text-blue-600 font-black text-2xl mb-10 px-2 italic text-left">
            Fineo
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {[
              { href: "/analyse", icon: BarChart3, label: t.ia },
              { href: "/historique", icon: History, label: t.history },
              { href: "/notation", icon: Star, label: t.rating },
              { href: "/commentaires", icon: MessageSquare, label: t.comments },
              { href: "/reporting", icon: FileText, label: t.reporting },
              { href: "/parametres", icon: Settings, label: t.settings },
            ].map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 no-underline group ${
                    isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span className="text-[15px] font-semibold">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 ml-64 min-h-screen">
          <div className="p-8 md:p-12 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}