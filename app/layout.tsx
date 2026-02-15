"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, Star, MessageSquare, Settings, FileText } from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="fr">
      <body className="flex min-h-screen bg-slate-50 text-slate-900">
        <nav className="w-64 h-screen bg-white border-r border-slate-200 p-6 flex flex-col fixed">
          <div className="text-blue-600 font-black text-2xl mb-10 italic">Fineo</div>
          <div className="flex flex-col gap-2">
            <Link href="/analyse" className={`flex items-center gap-3 p-3 rounded-xl ${pathname === '/analyse' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
              <BarChart3 className="w-5 h-5" />
              <span className="font-semibold">Analyse IA</span>
            </Link>
            {/* Ajoute les autres liens ici sur le même modèle si besoin */}
          </div>
        </nav>
        <main className="flex-1 ml-64 p-12">
          {children}
        </main>
      </body>
    </html>
  );
}