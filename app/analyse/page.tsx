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

interface SavedAnalysis {
  id: number;
  company: string;
  date: string;
  analysis: string;
}

export default function AnalysePage() {
  const [company, setCompany] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Correction : Vérification que window existe (SSR)
  useEffect(() => {
    const saved = sessionStorage.getItem("current_analysis");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setResult(data.result || "");
        setRawText(data.rawText || "");
        setCompany(data.company || "");
      } catch (e) {
        console.error("Erreur de parsing sessionStorage", e);
      }
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

  const formatAnalysis = (text: string): string => {
    if (!text) return "";
    let formatted = text
      .replace(/\{[\s\S]*?\}/g, "")
      .replace(/\[CHART_DATA\].*$/gm, "")
      // Amélioration de la regex pour les titres
      .replace(/^(\d\.\s[A-Z\sÉÈÀ'’]+)$/gm, "\n\n### $1\n\n");
    
    // Supprime la section 5 si demandée
    formatted = formatted.replace(/^5\.\s*CHIFFRES D'AFFAIRES ET RÉSULTAT NET[\s\S]*?(?=^\d\.\s|$)/gm, "");
    return formatted;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      setFile(acceptedFiles[0]);
      toast.info(`Fichier prêt : ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file || !company.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("company", company.trim());
    formData.append("lang", "fr"); // Ajout de la langue pour l'API

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Erreur lors de l'analyse");
      }

      const data = await response.json();
      setResult(data.analysis);
      setRawText(data.rawText);
      toast.success("Analyse terminée avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

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

      if (!res.ok) throw new Error();

      const data = await res.json();
      setChatMessages([
        ...newMsgs,
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      toast.error("Le chat expert ne répond pas");
    } finally {
      setIsChatLoading(false);
    }
  };

  const saveAnalyseToHistory = () => {
    if (!result || !company.trim()) return;
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
    toast.success("Enregistré dans l'historique");
  };

  const resetAnalyse = () => {
    setResult("");
    setRawText("");
    setFile(null);
    setChatMessages([]);
    setCompany("");
    sessionStorage.removeItem("current_analysis");
    toast.info("Interface réinitialisée");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 space-y-12 font-sans">
      <Toaster richColors position="top-right" />

      <div className="space-y-3">
        <h1 className="text-5xl font-black tracking-tight text-slate-900">
          Analyse IA<span className="text-blue-600">.</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-tight uppercase text-xs tracking-[0.2em]">
          Reporting & Audit Financier • Mistral AI Large
        </p>
      </div>

      {!result ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-xl space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Société</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ex: LVMH, TotalEnergies..."
                  className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition text-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Document PDF</label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl py-10 px-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className={`w-8 h-8 ${file ? "text-green-500" : "text-blue-600"}`} />
                <span className="font-semibold text-slate-600 text-sm mt-2 text-center">
                  {file ? file.name : "Glissez-déposez le rapport annuel"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Générer l'audit complet"}
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white p-10 md:p-14 rounded-3xl border border-slate-200 shadow-sm relative">
            <div className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-slate-50">
              <button onClick={saveAnalyseToHistory} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition"><Save className="w-4 h-4"/> Sauvegarder</button>
              <button onClick={resetAnalyse} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4"/> Supprimer</button>
              <button onClick={resetAnalyse} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition"><Upload className="w-4 h-4"/> Nouveau PDF</button>
            </div>

            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                components={{
                  h3: ({ ...props }) => <h3 className="text-xl font-bold text-blue-600 mt-10 mb-4 uppercase tracking-tight" {...props} />,
                  p: ({ ...props }) => <p className="mb-6 text-slate-700 leading-relaxed text-[15px]" {...props} />,
                  li: ({ ...props }) => <li className="mb-2 text-slate-700 text-[15px]" {...props} />,
                  strong: ({ ...props }) => <strong className="font-bold text-slate-900" {...props} />
                }}
              >
                {formatAnalysis(result)}
              </ReactMarkdown>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-3xl p-8 text-white sticky top-8 shadow-2xl flex flex-col h-[700px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Search className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-bold">Chat Expert</h4>
                  <span className="text-[9px] text-blue-400 uppercase font-black tracking-widest">Mistral Intelligence</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                {chatMessages.length === 0 && (
                   <p className="text-slate-500 text-sm italic">Posez des questions sur les risques, la solvabilité ou la stratégie de {company}...</p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && <div className="text-xs text-blue-400 animate-pulse">L'IA analyse le document...</div>}
              </div>

              <div className="relative mt-auto">
                <input
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askMistral()}
                  placeholder="Question sur le rapport..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-4 pr-12 py-4 text-sm outline-none focus:border-blue-500 transition"
                />
                <button onClick={askMistral} className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 p-2 rounded-xl hover:bg-blue-500"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}