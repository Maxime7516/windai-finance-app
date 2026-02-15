"use client";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Loader2,
  Building2,
  Search,
  Send,
  Save,
  Trash2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import ReactMarkdown from "react-markdown";

// Interface pour l'historique des analyses sauvegardées
interface SavedAnalysis {
  id: number;
  company: string;
  date: string;
  analysis: string;
}

export default function AnalysePage() {
  // États principaux
  const [company, setCompany] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Gestion du stockage local (sessionStorage)
  useEffect(() => {
    const saved = sessionStorage.getItem("current_analysis");
    if (saved) {
      const data = JSON.parse(saved);
      setResult(data.result);
      setRawText(data.rawText);
      setCompany(data.company || "");
    }
  }, []);

  useEffect(() => {
    if (result || company || rawText) {
      sessionStorage.setItem(
        "current_analysis",
        JSON.stringify({ result, rawText, company })
      );
    }
  }, [result, rawText, company]);

  // Fonction pour formater l'analyse et supprimer la section 5
  const formatAnalysis = (text: string): string => {
    if (!text) return "";
    // Supprime les sections entre accolades et les données de graphique
    let formatted = text
      .replace(/\{[\s\S]*?\}/g, "")
      .replace(/\[CHART_DATA\].*$/gm, "")
      .replace(/^(\d\.\s[A-Z\sÉÈÀ'’]+)$/gm, "\n\n### $1\n\n");
    // Supprime spécifiquement la section 5
    formatted = formatted.replace(/^5\.\s*CHIFFRES D'AFFAIRES ET RÉSULTAT NET[\s\S]*?(?=^\d\.\s|$)/gm, "");
    return formatted;
  };

  // Gestion du dépôt de fichier (drag & drop)
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // Fonction pour lancer l'analyse détaillée
  const handleAnalyze = async () => {
    if (!file || !company.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("company", company.trim());
    formData.append("analysisType", "detailed");

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data.analysis);
      setRawText(data.rawText);
      toast.success("Analyse détaillée terminée (50+ lignes)");
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour poser une question au chat
  const askMistral = async () => {
    if (!userQuestion.trim() || isChatLoading) return;

    const newMsgs = [...chatMessages, { role: "user", content: userQuestion }];
    setChatMessages(newMsgs);
    setUserQuestion("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          pdfContext: rawText,
        }),
      });

      const data = await res.json();
      setChatMessages([
        ...newMsgs,
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      toast.error("Erreur Chat");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Fonction pour sauvegarder l'analyse dans l'historique
  const saveAnalyseToHistory = () => {
    if (!result || !company.trim()) {
      toast.error("Rien à sauvegarder");
      return;
    }

    const existing = localStorage.getItem("analysis_history");
    const history: SavedAnalysis[] = existing ? JSON.parse(existing) : [];

    const newAnalysis: SavedAnalysis = {
      id: Date.now(),
      company: company.trim(),
      date: new Date().toLocaleString(),
      analysis: result,
    };

    history.unshift(newAnalysis);
    localStorage.setItem("analysis_history", JSON.stringify(history));
    toast.success("Analyse enregistrée dans l'historique");
  };

  // Fonction pour réinitialiser l'analyse
  const resetAnalyse = () => {
    setResult("");
    setRawText("");
    setFile(null);
    setChatMessages([]);
    setUserQuestion("");
    setCompany("");
    toast.success("Analyse supprimée");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 space-y-12 font-sans">
      <Toaster richColors position="top-right" />

      {/* En-tête */}
      <div className="space-y-3">
        <h1 className="text-5xl font-black tracking-tight text-slate-900">
          Analyse IA<span className="text-blue-600">.</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-tight">
          Reporting & Audit Financier (Analyse détaillée 50+ lignes)
        </p>
      </div>

      {!result ? (
        // Section d'upload de fichier
        <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-xl space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Champ pour le nom de l'entreprise */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Société
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Entrez le nom de l'entreprise"
                  className="w-full pl-14 pr-4 py-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition text-lg font-medium tracking-tight"
                />
              </div>
            </div>

            {/* Zone de dépôt de fichier */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Fichier PDF
              </label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-slate-200 rounded-2xl py-12 px-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 transition min-h-200px"
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-blue-600" />
                <span className="font-medium text-slate-600 truncate text-center tracking-tight mt-2">
                  {file ? file.name : "Importer le rapport (pour une analyse détaillée)"}
                </span>
              </div>
            </div>
          </div>

          {/* Bouton pour lancer l'analyse */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 rounded-2xl font-bold text-lg tracking-tight shadow-xl hover:bg-blue-600 transition flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Lancer l'analyse détaillée"}
          </button>
        </div>
      ) : (
        // Section des résultats et du chat
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Rapport */}
          <div className="lg:col-span-2 bg-white p-14 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-end gap-4 mb-6">
              <button
                onClick={saveAnalyseToHistory}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-2xl font-medium hover:bg-blue-500 transition"
              >
                <Save className="w-4 h-4" /> Enregistrer
              </button>

              <button
                onClick={resetAnalyse}
                className="flex items-center gap-2 bg-gray-300 text-slate-700 px-4 py-2 rounded-2xl font-medium hover:bg-gray-400 transition"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>

              <button
                onClick={resetAnalyse}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-2xl font-medium hover:bg-green-500 transition"
              >
                <Upload className="w-4 h-4" /> Nouvelle Analyse
              </button>
            </div>

            {/* Affichage du résultat avec ReactMarkdown */}
            <div className="prose max-w-none text-[15px] leading-6 font-light text-slate-700 space-y-6">
              <ReactMarkdown
                components={{
                  h3: ({ node, ...props }) => (
                    <h3 className="text-[16px] font-bold text-blue-700 mt-8 mb-4">
                      {props.children}
                    </h3>
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-4 text-[15px] leading-6 font-light">
                      {props.children}
                    </p>
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-slate-900">
                      {props.children}
                    </strong>
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-4">{props.children}</ul>
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 mb-4">{props.children}</ol>
                  ),
                }}
              >
                {formatAnalysis(result)}
              </ReactMarkdown>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-3xl p-8 text-white sticky top-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold tracking-tight">Chat Expert</h4>
                  <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold">
                    Mistral 8x7B (Analyse approfondie)
                  </span>
                </div>
              </div>

              <div className="h-550px overflow-y-auto space-y-4 mb-6 pr-2">
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] px-4 py-3 rounded-2xl text-[15px] leading-5 font-light ${
                        m.role === "user"
                          ? "bg-blue-600"
                          : "bg-white/10 border border-white/5"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="text-[15px] leading-5 font-light text-slate-400">
                    Mistral génère une analyse détaillée...
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askMistral()}
                  placeholder="Posez une question pour approfondir l'analyse"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-4 text-[15px] leading-5 font-light outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={askMistral}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 p-2 rounded-xl hover:bg-blue-500 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
