"use client";
import { useState, useEffect } from "react";
import { Globe, Check } from "lucide-react";

export default function ParametresPage() {
  const [language, setLanguage] = useState("fr");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "fr";
    setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    // On recharge pour que le layout et toutes les pages captent le changement
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-8">
          {language === "fr" ? "Paramètres" : "Settings"}<span className="text-blue-600">.</span>
        </h1>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {language === "fr" ? "Langue de l'application" : "Application Language"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { id: "fr", label: "Français", flag: "🇫🇷" },
              { id: "en", label: "English", flag: "🇬🇧" }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => changeLanguage(lang.id)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  language === lang.id 
                    ? "border-blue-600 bg-blue-50" 
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3 font-bold text-slate-700">
                  <span className="text-xl">{lang.flag}</span>
                  {lang.label}
                </div>
                {language === lang.id && <Check className="w-5 h-5 text-blue-600" />}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}