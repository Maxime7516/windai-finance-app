"use client";

import { useState, useEffect, useRef } from "react";

interface SavedNote {
  id: number;
  company: string;
  content: string;
  date: string;
}

interface AnalysisHistoryItem {
  id: number;
  company: string;
}

export default function CommentairesPage() {
  const [comment, setComment] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Nouvel état pour la recherche
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<AnalysisHistoryItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const notesData = localStorage.getItem("user_notes");
    if (notesData) {
      try { setSavedNotes(JSON.parse(notesData)); } catch (e) { console.error(e); }
    }

    const historyData = localStorage.getItem("analysis_history");
    if (historyData) {
      try {
        setAvailableCompanies(JSON.parse(historyData));
      } catch (e) {
        console.error("Erreur historique", e);
      }
    }
  }, []);

  // Filtrage intelligent des entreprises
  const filteredCompanies = availableCompanies.filter(item =>
    item.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm(""); // Reset la recherche quand on ferme
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (!selectedCompany || !comment.trim()) return;

    const newNote: SavedNote = {
      id: Date.now(),
      company: selectedCompany,
      content: comment,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      }),
    };

    const updatedNotes = [newNote, ...savedNotes];
    setSavedNotes(updatedNotes);
    localStorage.setItem("user_notes", JSON.stringify(updatedNotes));
    setComment("");
    setShowToast(true);
  };

  const deleteNote = (id: number) => {
    const updated = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updated);
    localStorage.setItem("user_notes", JSON.stringify(updated));
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans relative">
      
      {showToast && (
        <div className="fixed top-8 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            <span className="font-bold">Note enregistrée</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Commentaires<span className="text-blue-600">.</span></h1>
        </header>

        {/* SÉLECTION SOCIÉTÉ AVEC RECHERCHE */}
        <div className="mb-6" ref={dropdownRef}>
          <div className="relative w-full md:w-80">
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm cursor-pointer hover:border-blue-400 transition-all"
            >
              <span className="truncate">{selectedCompany || "Rechercher une société..."}</span>
              <svg className={`w-5 h-5 text-blue-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isDropdownOpen && (
              <div className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Champ de recherche interne */}
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Taper pour filtrer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 text-sm font-semibold"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setSelectedCompany(item.company); 
                          setIsDropdownOpen(false);
                          setSearchTerm(""); 
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 text-slate-700 font-semibold border-b border-slate-50 last:border-none transition-colors"
                      >
                        {item.company}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-400 text-sm italic">
                      Aucun résultat pour "{searchTerm}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ZONE DE SAISIE */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-12">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={selectedCompany ? `Note pour ${selectedCompany}...` : "Sélectionnez d'abord une société"}
            disabled={!selectedCompany}
            className="w-full h-40 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-700 resize-none disabled:opacity-50"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={!selectedCompany || !comment.trim()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
            >
              Enregistrer
            </button>
          </div>
        </section>

        {/* LISTE DES NOTES */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            Notes enregistrées
          </h2>
          
          {savedNotes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
               Aucune note rédigée.
            </div>
          ) : (
            savedNotes.map((note) => (
              <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest">
                      {note.company}
                    </span>
                    <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-tight flex items-center gap-1">
                      {note.date}
                    </p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}