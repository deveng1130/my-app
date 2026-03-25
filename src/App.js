import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import './App.css';

function Home({ onStart }) {
  return (
    <div className="page home-page">
      <h1>NFL Prediction</h1>
      <p className="subtitle">Choose teams and predict win probabilities</p>
      <button className="primary" onClick={onStart}>Predict</button>
    </div>
  );
}

function Prediction({ onBack, teams, teamStats }) {
  const [homeTeam, setHomeTeam] = useState(teams[0] || '');
  const [awayTeam, setAwayTeam] = useState(teams[1] || '');
  const [result, setResult] = useState({ winner: null, pct: null, error: null });

  // Get rating from stats
  const getRating = useCallback((name) => {
    return teamStats[name]?.rating || 0;
  }, [teamStats]);

  useEffect(() => {
    if (!homeTeam && teams.length > 1) {
      setHomeTeam(teams[0]);
    }
    if (!awayTeam && teams.length > 1) {
      setAwayTeam(teams[1]);
    }
  }, [teams, homeTeam, awayTeam]);

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
    if (rHome + rAway === 0) {
      setResult({ winner: null, pct: null, error: 'Data not available for these teams' });
      return;
    }
    const recordHome = teamStats[homeTeam]?.recordPct || 0.5;
    const recordAway = teamStats[awayTeam]?.recordPct || 0.5;
    // Use direct ratio of normalized ratings for simpler 'normal' prediction
    const homeScore = rHome + 1.2 + (recordHome - 0.5) * 4;
    const awayScore = rAway + (recordAway - 0.5) * 4;
    const totalScore = homeScore + awayScore;
    let pctHome = totalScore === 0 ? 50 : Math.round((homeScore / totalScore) * 100);
    pctHome = Math.max(1, Math.min(99, pctHome));
    const pctAway = 100 - pctHome;
    const winner = pctHome >= 50 ? homeTeam : awayTeam;
    setResult({ winner, pctHome, pctAway, error: null });
  }, [homeTeam, awayTeam, getRating, teamStats]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (result.error) return;
    alert(`${result.winner} is predicted to win (${result.pctHome}%/${result.pctAway}% vs opponent)`);
  };

  return (
    <div className="page prediction-page">
      <h2>Make a Prediction</h2>
      <form onSubmit={handleSubmit} className="prediction-form">
        <label>
          Home Team
          <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}>
            {teams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          Away Team
          <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}>
            {teams.map((t) => (
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
              <div>{homeTeam} win probability: <strong>{result.pctHome}%</strong></div>
              <div>{awayTeam} win probability: <strong>{result.pctAway}%</strong></div>
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
  const [teams, setTeams] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [teamMap, setTeamMap] = useState({});

  useEffect(() => {
    // Load teams first (names + key map)
    fetch('/all_teams.csv')
      .then(response => response.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: (results) => {
            const teamList = results.data.map(row => row.FullName).filter(name => name);
            setTeams(teamList);
            const map = {};
            results.data.forEach(row => {
              if (row.Key && row.FullName) {
                map[row.Key] = row.FullName;
              }
            });
            setTeamMap(map);
          }
        });
      });
  }, []);

  useEffect(() => {
    if (!Object.keys(teamMap).length) return;

    // Load player stats and aggregate by team after teamMap is ready
    fetch('/cleaned_nfl_data.csv')
      .then(response => response.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: (results) => {
            const stats = {};
            results.data.forEach(row => {
              const teamKey = row.Team;
              const teamName = teamMap[teamKey] || row.Team;
              if (!stats[teamName]) {
                stats[teamName] = { total_yards: 0, tds: 0, fumbles: 0 };
              }
              stats[teamName].total_yards += parseFloat(row.total_yards || 0);
              stats[teamName].tds += parseFloat(row.tds || 0);
              stats[teamName].fumbles += parseFloat(row.fumbles || 0);
            });
            Object.keys(stats).forEach(team => {
              const yardsScore = stats[team].total_yards / 200;
              const tdScore = stats[team].tds * 6;
              const fumScore = stats[team].fumbles * -3;
              stats[team].rating = yardsScore + tdScore + fumScore;
            });
            // Derive an estimated record from ratings (0.35..0.65 range)
            const ratingValues = Object.values(stats).map((v) => v.rating);
            const minRating = Math.min(...ratingValues);
            const maxRating = Math.max(...ratingValues);
            Object.keys(stats).forEach(team => {
              const normalized = maxRating === minRating ? 0.5 : (stats[team].rating - minRating) / (maxRating - minRating);
              stats[team].recordPct = 0.35 + normalized * 0.3;
            });
            setTeamStats(stats);
          }
        });
      });
  }, [teamMap]);

  return (
    <div className="App">
      <header className="App-header">
        {page === 'home' && <Home onStart={() => setPage('predict')} />}
        {page === 'predict' && <Prediction onBack={() => setPage('home')} teams={teams} teamStats={teamStats} />}
      </header>
    </div>
  );
}

export default App;

