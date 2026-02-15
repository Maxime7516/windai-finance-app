"use client";
import { useState, useEffect } from "react";
import { Trash2, Edit3, Save, X, Check } from "lucide-react";
import { toast, Toaster } from "sonner";

interface SavedAnalysis {
  id: number;
  company: string;
  date: string;
  analysis: string;
}

export default function HistoriquePage() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [currentAnalysis, setCurrentAnalysis] = useState<SavedAnalysis | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const loadHistory = () => {
      const data = localStorage.getItem("analysis_history");
      if (data) setAnalyses(JSON.parse(data));
    };
    loadHistory();
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    const found = analyses.find(a => a.id.toString() === id);
    setCurrentAnalysis(found || null);
    setIsEditing(false);
  };

  const deleteAnalysis = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette analyse ?")) return;

    const newAnalyses = analyses.filter(a => a.id !== id);
    localStorage.setItem("analysis_history", JSON.stringify(newAnalyses));
    setAnalyses(newAnalyses);
    
    window.dispatchEvent(new Event('storage'));
    
    if (currentAnalysis?.id === id) {
      setCurrentAnalysis(null);
      setSelectedId("");
    }
    toast.success("Analyse supprimée");
  };

  const saveUpdate = () => {
    if (!currentAnalysis) return;

    const updatedAnalyses = analyses.map(a => 
      a.id === currentAnalysis.id ? { ...a, analysis: editContent } : a
    );

    localStorage.setItem("analysis_history", JSON.stringify(updatedAnalyses));
    setAnalyses(updatedAnalyses);
    setCurrentAnalysis({ ...currentAnalysis, analysis: editContent });
    setIsEditing(false);
    toast.success("Modification enregistrée !");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      <Toaster richColors />
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-blue-600 rounded-full hidden md:block" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Historique<span className="text-blue-600">.</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            {analyses.length} analyse{analyses.length > 1 ? 's' : ''} archivée{analyses.length > 1 ? 's' : ''}.
          </p>
        </header>

        <div className="grid gap-8">
          <section className="bg-white p-1 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="p-6">
              <label className="flex items-center gap-2 text-[11px] font-bold text-blue-600 mb-3 uppercase tracking-[0.15em]">
                Sélectionner une entreprise
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <select
                    value={selectedId}
                    onChange={(e) => handleSelectChange(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none font-semibold text-slate-700 transition-all duration-300 appearance-none cursor-pointer hover:bg-slate-100"
                  >
                    <option value="">
                      {analyses.length > 0 ? "Parcourir vos rapports..." : "Aucune analyse sauvegardée"}
                    </option>
                    {analyses.map((item) => (
                      <option key={item.id} value={item.id.toString()}>
                        {item.company} — {item.date}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {currentAnalysis && (
                  <button 
                    onClick={() => deleteAnalysis(currentAnalysis.id)}
                    className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                    title="Supprimer cette analyse"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {currentAnalysis ? (
            <article className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-slate-900 p-6 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl uppercase">
                    {currentAnalysis.company.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">{currentAnalysis.company}</h3>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Généré le {currentAnalysis.date}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-all">
                        <X className="w-4 h-4" /> Annuler
                      </button>
                      <button onClick={saveUpdate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-500 transition-all shadow-lg shadow-green-900/20">
                        <Check className="w-4 h-4" /> Sauvegarder
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { setIsEditing(true); setEditContent(currentAnalysis.analysis); }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-all"
                    >
                      <Edit3 className="w-4 h-4" /> Modifier l'analyse
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8 md:p-12">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{ minHeight: '600px' }}
                    className="w-full p-6 bg-slate-50 border-2 border-blue-100 rounded-xl focus:border-blue-500 outline-none font-serif text-lg leading-relaxed text-slate-700 transition-all resize-y"
                  />
                ) : (
                  <div className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-normal border-l-4 border-blue-100 pl-6">
                    {currentAnalysis.analysis}
                  </div>
                )}
              </div>
            </article>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 group transition-all duration-500 hover:border-blue-200 hover:bg-white">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-50 transition-all">
                <svg className="w-8 h-8 text-slate-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium max-w-xs text-center px-4">
                {analyses.length > 0 
                  ? "Sélectionnez un document pour révéler son contenu" 
                  : "Commencez par générer et sauvegarder une analyse sur le Dashboard"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}