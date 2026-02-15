"use client";
import { useState, useEffect } from "react";
import { TrendingUp, BarChart4, Users, LineChart, Save } from "lucide-react";
import { toast, Toaster } from "sonner";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer 
} from "recharts";

interface SavedAnalysis {
  id: number;
  company: string;
}

interface CompanyScores {
  caGrowth: number;
  resultGrowth: number;
  mgmtQuality: number;
  stockGrowth: number;
  saveDate?: string; // On ajoute la date de sauvegarde ici
}

export default function NotationPage() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [scores, setScores] = useState<CompanyScores>({
    caGrowth: 3,
    resultGrowth: 3,
    mgmtQuality: 3,
    stockGrowth: 3,
  });

  useEffect(() => {
    const data = localStorage.getItem("analysis_history");
    if (data) setAnalyses(JSON.parse(data));
  }, []);

  useEffect(() => {
    if (selectedId) {
      const savedScores = localStorage.getItem(`expert_scores_${selectedId}`);
      if (savedScores) setScores(JSON.parse(savedScores));
      else setScores({ caGrowth: 3, resultGrowth: 3, mgmtQuality: 3, stockGrowth: 3 });
    }
  }, [selectedId]);

  // Fonction pour générer le label avec la date de SAUVEGARDE
  const getOptionLabel = (item: SavedAnalysis) => {
    const saved = localStorage.getItem(`expert_scores_${item.id}`);
    if (!saved) return item.company;

    const s: CompanyScores = JSON.parse(saved);
    const avg = ((s.caGrowth + s.resultGrowth + s.mgmtQuality + s.stockGrowth) / 4).toFixed(1);
    
    // Si on a une date de sauvegarde, on l'utilise, sinon on n'affiche rien
    if (s.saveDate) {
      const dateObj = new Date(s.saveDate);
      const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      return `[${formattedDate}] ${item.company} — Note : ${avg}/5`;
    }
    
    return `${item.company} — Note : ${avg}/5`;
  };

  const chartData = [
    { subject: 'CA', A: scores.caGrowth, fullMark: 5 },
    { subject: 'Résultat', A: scores.resultGrowth, fullMark: 5 },
    { subject: 'Management', A: scores.mgmtQuality, fullMark: 5 },
    { subject: 'Bourse', A: scores.stockGrowth, fullMark: 5 },
  ];

  const handleScoreChange = (field: keyof CompanyScores, value: number) => {
    setScores(prev => ({ ...prev, [field]: value }));
  };

  const saveAnalysis = () => {
    if (!selectedId) return;
    
    // On capture la date précise du clic
    const analysisToSave = {
      ...scores,
      saveDate: new Date().toISOString()
    };
    
    localStorage.setItem(`expert_scores_${selectedId}`, JSON.stringify(analysisToSave));
    setScores(analysisToSave); // Update local state to include the date
    setAnalyses([...analyses]); // Force refresh du menu
    toast.success("Notation enregistrée à la date d'aujourd'hui !");
  };

  const calculateAverage = () => {
    const avg = (scores.caGrowth + scores.resultGrowth + scores.mgmtQuality + scores.stockGrowth) / 4;
    return avg.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900">
      <Toaster richColors position="top-right" />
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Analyse Fondamentale<span className="text-blue-600">.</span></h1>
            <p className="text-slate-500 mt-2 font-medium">L'historique affiche la date de votre dernière modification.</p>
          </div>
          {selectedId && (
            <button onClick={saveAnalysis} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              <Save className="w-5 h-5" /> Enregistrer la notation
            </button>
          )}
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-10">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 appearance-none cursor-pointer">
            <option value="">Sélectionner une société...</option>
            {analyses.map((item) => (
              <option key={item.id} value={item.id.toString()}>
                {getOptionLabel(item)}
              </option>
            ))}
          </select>
        </div>

        {selectedId ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'caGrowth', label: "CA", icon: TrendingUp },
                { id: 'resultGrowth', label: "Résultat", icon: BarChart4 },
                { id: 'mgmtQuality', label: "Mgmt", icon: Users },
                { id: 'stockGrowth', label: "Bourse", icon: LineChart },
              ].map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                  <span className="text-2xl font-black mb-4">{scores[item.id as keyof CompanyScores]}</span>
                  <div className="h-40 w-12 bg-slate-50 rounded-2xl relative flex justify-center py-4 border border-slate-100 shadow-inner">
                    <input
                      type="range" min="1" max="5" step="0.5"
                      value={scores[item.id as keyof CompanyScores]}
                      onChange={(e) => handleScoreChange(item.id as keyof CompanyScores, parseFloat(e.target.value))}
                      className="h-32 w-1 appearance-none bg-slate-200 rounded-full cursor-pointer accent-blue-600"
                      style={{ WebkitAppearance: 'slider-vertical' } as any}
                    />
                  </div>
                  <span className="mt-4 font-bold text-[10px] uppercase text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-80 overflow-visible">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Profil de Qualité</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={chartData} margin={{ top: 10, right: 45, bottom: 10, left: 45 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                    <Radar name="Score" dataKey="A" stroke="#2563eb" strokeWidth={3} fill="#3b82f6" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-12 bg-slate-900 rounded-3xl p-8 shadow-xl flex flex-col items-center">
                <div className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Note de Synthèse</div>
                <div className="text-7xl font-black text-white">{calculateAverage()}<span className="text-2xl text-slate-600 ml-2">/ 5</span></div>
            </div>

          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
            Sélectionnez une entreprise pour voir le radar.
          </div>
        )}
      </div>

      <style jsx global>{`
        input[type=range]::-webkit-slider-thumb {
          width: 20px; height: 20px; background: #2563eb; border: 3px solid white; border-radius: 50%; cursor: pointer; -webkit-appearance: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}