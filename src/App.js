import React, { useState, useEffect } from 'react';
import './App.css';

const TEAMS = [
  'Team A',
  'Team B',
  'Team C',
  'Team D',
  'Team E',
];

function Home({ onStart }) {
  return (
    <div className="page home-page">
      <h1>NFL Prediction</h1>
      <p className="subtitle">Choose teams and predict win probabilities</p>
      <button className="primary" onClick={onStart}>Predict</button>
    </div>
  );
}

function Prediction({ onBack }) {
  const [homeTeam, setHomeTeam] = useState(TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState(TEAMS[1]);
  const [result, setResult] = useState({ winner: null, pct: null, error: null });

  // deterministic pseudo-rating based on team name
  const getRating = (name) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h << 5) - h + name.charCodeAt(i);
      h |= 0;
    }
    h = Math.abs(h);
    // map to 30..170 range to create meaningful differences
    return (h % 140) + 30;
  };

  useEffect(() => {
    if (!homeTeam || !awayTeam) {
      setResult({ winner: null, pct: null, error: 'Select both teams' });
      return;
    }
    if (homeTeam === awayTeam) {
      setResult({ winner: null, pct: null, error: "Pick two different teams" });
      return;
    }

    const rHome = getRating(homeTeam);
    const rAway = getRating(awayTeam);
    const pctHome = Math.round((rHome / (rHome + rAway)) * 100);
    const winner = pctHome >= 50 ? homeTeam : awayTeam;
    setResult({ winner, pct: pctHome, error: null });
  }, [homeTeam, awayTeam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (result.error) return;
    alert(`${result.winner} is predicted to win (${result.pct}% chance)`);
  };

  return (
    <div className="page prediction-page">
      <h2>Make a Prediction</h2>
      <form onSubmit={handleSubmit} className="prediction-form">
        <label>
          Home Team
          <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          Away Team
          <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <div className="prediction-result">
          {result.error ? (
            <div className="error">{result.error}</div>
          ) : (
            <div>
              Predicted winner: <strong>{result.winner}</strong>
              <div>Win probability: <strong>{result.pct}%</strong></div>
            </div>
          )}
        </div>

        <div className="buttons">
          <button type="button" onClick={onBack}>Back</button>
          <button type="submit" className="primary" disabled={!!result.error}>Submit Prediction</button>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [page, setPage] = useState('home');

  return (
    <div className="App">
      <header className="App-header">
        {page === 'home' && <Home onStart={() => setPage('predict')} />}
        {page === 'predict' && <Prediction onBack={() => setPage('home')} />}
      </header>
    </div>
  );
}

export default App;

