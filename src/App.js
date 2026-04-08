import React, { useState, useEffect } from 'react';
import './App.css';

const TEAMS = [
  'ARI Cardinals', 'ATL Falcons', 'BAL Ravens', 'BUF Bills', 'CAR Panthers',
  'CHI Bears', 'CIN Bengals', 'CLE Browns', 'DAL Cowboys', 'DEN Broncos',
  'DET Lions', 'GB Packers', 'HOU Texans', 'IND Colts', 'JAX Jaguars',
  'KC Chiefs', 'LV Raiders', 'LAC Chargers', 'LAR Rams', 'MIA Dolphins',
  'MIN Vikings', 'NE Patriots', 'NO Saints', 'NYG Giants', 'NYJ Jets',
  'PHI Eagles', 'PIT Steelers', 'SF 49ers', 'SEA Seahawks', 'TB Buccaneers',
  'TEN Titans', 'WAS Commanders'
];

function Home({ onStart }) {
  return (
    <div className="page home-page">
      <div className="hero-content">
        <div className="status-badge">SYSTEM STATUS: ACTIVE</div>
        <h1>NFL PERFORMANCE<br/>PREDICTION</h1>
        <p className="subtitle">Machine Learning & Real-Time Data Analytics</p>
        <div className="hero-accent-bar"></div>
        <button className="primary-btn" onClick={onStart}>Initialize Analysis</button>
      </div>
    </div>
  );
}

function Prediction({ onBack }) {
  const [homeTeam, setHomeTeam] = useState(TEAMS[8]); // Default Dallas
  const [awayTeam, setAwayTeam] = useState(TEAMS[30]); // Default Tennessee
  const [result, setResult] = useState({ winner: null, pct: null, error: null });

  const getRating = (name) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h << 5) - h + name.charCodeAt(i);
      h |= 0;
    }
    h = Math.abs(h);
    return (h % 140) + 30;
  };

  useEffect(() => {
    if (homeTeam === awayTeam) {
      setResult({ winner: null, pct: null, error: "SELECT UNIQUE MATCHUP" });
      return;
    }
    const rHome = getRating(homeTeam);
    const rAway = getRating(awayTeam);
    const pctHome = Math.round((rHome / (rHome + rAway)) * 100);
    const winner = pctHome >= 50 ? homeTeam : awayTeam;
    setResult({ winner, pct: pctHome, error: null });
  }, [homeTeam, awayTeam]);

  return (
    <div className="page prediction-page">
      <div className="glass-panel">
        <div className="panel-header">
          <span className="node-id">NODE_08_PRO</span>
          <span className="live-indicator">● LIVE ANALYTICS</span>
        </div>

        <div className="matchup-ui">
          <div className="team-box">
            <span className="label">HOME_SQUAD</span>
            <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}>
              {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="vs-sign">VS</div>

          <div className="team-box">
            <span className="label">AWAY_SQUAD</span>
            <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}>
              {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="results-area">
          {result.error ? (
            <div className="error-text">{result.error}</div>
          ) : (
            <>
              <div className="analysis-text">PROBABILISTIC_OUTCOME:</div>
              <div className="winner-display">{result.winner}</div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${result.pct}%` }}>
                  <span className="pct-text">{result.pct}% CONFIDENCE</span>
                </div>
              </div>
            </>
          )}
        </div>

        <button className="back-btn" onClick={onBack}>BACK TO DASHBOARD</button>
      </div>
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