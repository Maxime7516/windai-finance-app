import React from 'react';

export default function Page() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>WindAI Finance App</h1>
      <p>L'application est en cours de développement.</p>
      <nav>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <li><a href="/analyse">Analyse</a></li>
          <li><a href="/historique">Historique</a></li>
          <li><a href="/parametres">Paramètres</a></li>
        </ul>
      </nav>
    </main>
  );
}