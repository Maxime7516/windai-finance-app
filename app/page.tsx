import React from 'react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-blue-600">Bienvenue sur Fineo</h1>
      <p className="mt-4 text-gray-600">Ton application d'analyse financière est prête.</p>
      <p className="mt-2">Utilise le menu à gauche pour commencer l'analyse.</p>
    </div>
  );
}