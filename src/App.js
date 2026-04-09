import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import './App.css';

const STAT_OPTIONS = {
  QB: [
    { value: 'passingYards', label: 'Passing Yards', unit: 'yds', max: 400 },
    { value: 'passingTDs', label: 'Passing TDs', unit: 'TDs', max: 5 },
    { value: 'interceptions', label: 'Interceptions', unit: 'INTs', max: 5 },
    { value: 'rushingYards', label: 'Rushing Yards', unit: 'yds', max: 150 },
  ],
  RB: [
    { value: 'rushingYards', label: 'Rushing Yards', unit: 'yds', max: 250 },
    { value: 'rushingTDs', label: 'Rushing TDs', unit: 'TDs', max: 5 },
    { value: 'receivingYards', label: 'Receiving Yards', unit: 'yds', max: 150 },
  ],
  WR: [
    { value: 'receivingYards', label: 'Receiving Yards', unit: 'yds', max: 250 },
    { value: 'receptions', label: 'Receptions', unit: 'rec', max: 15 },
    { value: 'receivingTDs', label: 'Receiving TDs', unit: 'TDs', max: 5 },
  ],
  TE: [
    { value: 'receivingYards', label: 'Receiving Yards', unit: 'yds', max: 250 },
    { value: 'receptions', label: 'Receptions', unit: 'rec', max: 15 },
    { value: 'receivingTDs', label: 'Receiving TDs', unit: 'TDs', max: 5 },
  ],
};

const THRESHOLD_PRESETS = [50, 100, 150, 200];

const MOCK_DEFENSE = {
  'ARI': { passRank: 19, rushRank: 16, sacksAllowed: 2.1 },
  'ATL': { passRank: 18, rushRank: 21, sacksAllowed: 2.5 },
  'BAL': { passRank: 10, rushRank: 11, sacksAllowed: 2.3 },
  'BUF': { passRank: 2, rushRank: 6, sacksAllowed: 1.8 },
  'CAR': { passRank: 24, rushRank: 29, sacksAllowed: 3.1 },
  'CHI': { passRank: 27, rushRank: 24, sacksAllowed: 2.9 },
  'CIN': { passRank: 11, rushRank: 14, sacksAllowed: 2.4 },
  'CLE': { passRank: 3, rushRank: 9, sacksAllowed: 2.0 },
  'DAL': { passRank: 12, rushRank: 8, sacksAllowed: 2.2 },
  'DEN': { passRank: 23, rushRank: 20, sacksAllowed: 2.6 },
  'DET': { passRank: 21, rushRank: 19, sacksAllowed: 2.7 },
  'GB': { passRank: 17, rushRank: 22, sacksAllowed: 2.8 },
  'HOU': { passRank: 26, rushRank: 28, sacksAllowed: 3.2 },
  'IND': { passRank: 16, rushRank: 15, sacksAllowed: 2.5 },
  'JAX': { passRank: 25, rushRank: 23, sacksAllowed: 3.0 },
  'KC': { passRank: 4, rushRank: 10, sacksAllowed: 1.9 },
  'LV': { passRank: 15, rushRank: 13, sacksAllowed: 2.4 },
  'LAC': { passRank: 8, rushRank: 12, sacksAllowed: 2.1 },
  'LAR': { passRank: 6, rushRank: 7, sacksAllowed: 1.9 },
  'MIA': { passRank: 14, rushRank: 17, sacksAllowed: 2.5 },
  'MIN': { passRank: 20, rushRank: 18, sacksAllowed: 2.7 },
  'NE': { passRank: 13, rushRank: 5, sacksAllowed: 2.0 },
  'NO': { passRank: 9, rushRank: 4, sacksAllowed: 2.0 },
  'NYG': { passRank: 22, rushRank: 26, sacksAllowed: 2.9 },
  'NYJ': { passRank: 28, rushRank: 25, sacksAllowed: 3.1 },
  'PHI': { passRank: 7, rushRank: 3, sacksAllowed: 1.8 },
  'PIT': { passRank: 5, rushRank: 2, sacksAllowed: 1.7 },
  'SEA': { passRank: 1, rushRank: 1, sacksAllowed: 1.6 },
  'SF': { passRank: 17, rushRank: 6, sacksAllowed: 2.1 },
  'TB': { passRank: 29, rushRank: 27, sacksAllowed: 3.2 },
  'TEN': { passRank: 30, rushRank: 30, sacksAllowed: 3.4 },
  'WAS': { passRank: 31, rushRank: 31, sacksAllowed: 3.5 },
};

const MOCK_OFFENSE = {
  'ARI': { passRank: 20, rushRank: 18, pointsPerGame: 22.5 },
  'ATL': { passRank: 15, rushRank: 14, pointsPerGame: 25.0 },
  'BAL': { passRank: 5, rushRank: 7, pointsPerGame: 28.5 },
  'BUF': { passRank: 3, rushRank: 4, pointsPerGame: 30.0 },
  'CAR': { passRank: 25, rushRank: 27, pointsPerGame: 20.0 },
  'CHI': { passRank: 28, rushRank: 26, pointsPerGame: 18.5 },
  'CIN': { passRank: 12, rushRank: 13, pointsPerGame: 26.0 },
  'CLE': { passRank: 8, rushRank: 9, pointsPerGame: 27.5 },
  'DAL': { passRank: 10, rushRank: 8, pointsPerGame: 27.0 },
  'DEN': { passRank: 22, rushRank: 21, pointsPerGame: 21.5 },
  'DET': { passRank: 24, rushRank: 23, pointsPerGame: 20.5 },
  'GB': { passRank: 14, rushRank: 15, pointsPerGame: 25.5 },
  'HOU': { passRank: 27, rushRank: 28, pointsPerGame: 19.0 },
  'IND': { passRank: 16, rushRank: 16, pointsPerGame: 24.5 },
  'JAX': { passRank: 26, rushRank: 25, pointsPerGame: 19.5 },
  'KC': { passRank: 1, rushRank: 2, pointsPerGame: 32.0 },
  'LV': { passRank: 17, rushRank: 17, pointsPerGame: 24.0 },
  'LAC': { passRank: 7, rushRank: 6, pointsPerGame: 28.0 },
  'LAR': { passRank: 4, rushRank: 3, pointsPerGame: 29.5 },
  'MIA': { passRank: 13, rushRank: 12, pointsPerGame: 26.5 },
  'MIN': { passRank: 19, rushRank: 20, pointsPerGame: 23.0 },
  'NE': { passRank: 11, rushRank: 5, pointsPerGame: 26.5 },
  'NO': { passRank: 6, rushRank: 1, pointsPerGame: 28.5 },
  'NYG': { passRank: 23, rushRank: 24, pointsPerGame: 21.0 },
  'NYJ': { passRank: 29, rushRank: 29, pointsPerGame: 17.5 },
  'PHI': { passRank: 9, rushRank: 10, pointsPerGame: 27.5 },
  'PIT': { passRank: 2, rushRank: 11, pointsPerGame: 31.0 },
  'SEA': { passRank: 18, rushRank: 19, pointsPerGame: 23.5 },
  'SF': { passRank: 21, rushRank: 22, pointsPerGame: 22.0 },
  'TB': { passRank: 30, rushRank: 30, pointsPerGame: 16.0 },
  'TEN': { passRank: 31, rushRank: 31, pointsPerGame: 15.5 },
  'WAS': { passRank: 32, rushRank: 32, pointsPerGame: 14.0 },
};

// Normal distribution CDF (Cumulative Distribution Function)
const normalCDF = (x) => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX));

  return 0.5 * (1.0 + sign * y);
};

// Calculate probability of exceeding a threshold using normal distribution
const calculateThresholdProbability = (mean, stdDev, threshold) => {
  if (stdDev === 0) {
    return mean >= threshold ? 100 : 0;
  }
  const zScore = (threshold - mean) / stdDev;
  const probability = (1 - normalCDF(zScore)) * 100;
  let finalProbability = Math.max(1, Math.min(85, Math.round(probability))); // Cap at 85% for betting realism
  return finalProbability;
};

// Calculate standard deviation from a value (estimate based on typical player variance)
const estimateStdDev = (average, statType) => {
  // Use very high variance for betting realism - sports are unpredictable
  return Math.max(1, average * 0.7);
};

// Adjustment factors for defense
const getDefenseAdjustment = (defense, statType) => {
  const avgRank = (defense.passRank + defense.rushRank) / 2;
  // Better defense (lower rank) = lower adjustment
  // Worse defense (higher rank) = higher adjustment
  // Stronger impact for betting realism
  const adjustment = (avgRank - 16) / 10; // Changed from 16 to 10 for stronger effect
  return adjustment;
};

// Location adjustment
const getLocationAdjustment = (location) => {
  return location === 'Home' ? 0.1 : -0.08; // Increased from 0.05/-0.03 for stronger betting impact
};

const getStatLabel = (value) => {
  const all = Object.values(STAT_OPTIONS).flat();
  return all.find((item) => item.value === value)?.label || value;
};

const getDerivedStat = (player, stat) => {
  if (!player) return 0;
  switch (stat) {
    case 'passingYards':
      return Math.round(player.pass_yds || 0);
    case 'passingTDs':
      return Math.round(player.tds || 0);
    case 'interceptions':
      return Math.max(0, Math.round((player.pass_yds || 0) / 450));
    case 'rushingYards':
      return Math.round(player.rush_yds || 0);
    case 'rushingTDs':
      return Math.round((player.tds || 0) * 0.3);
    case 'receivingYards':
      return Math.round(player.recv_yds || 0);
    case 'receptions':
      return Math.round((player.recv_yds || 0) / 12);
    case 'receivingTDs':
      return Math.round((player.tds || 0) * 0.4);
    default:
      return 0;
  }
};

const computeAverage = (value, games = 17) => {
  return Math.max(0, Math.round((value / games) * 10) / 10);
};

const probabilityColor = (pct) => {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 40) return 'bg-amber-400';
  return 'bg-red-500';
};

function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamMap, setTeamMap] = useState({});
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [statType, setStatType] = useState('passingYards');
  const [threshold, setThreshold] = useState(100);
  const [timeframe, setTimeframe] = useState('Last 5 games');
  const [location, setLocation] = useState('Home');
  const [weatherImpact, setWeatherImpact] = useState(false);
  const [injuryImpact, setInjuryImpact] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  // Team prediction states
  const [awayTeam, setAwayTeam] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [teamPrediction, setTeamPrediction] = useState(null);

  useEffect(() => {
    fetch('/all_teams.csv')
      .then((response) => response.text())
      .then((csv) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const cleanTeams = results.data
              .map((row) => row.FullName)
              .filter(Boolean)
              .sort();
            const teamMapObj = {};
            results.data.forEach((row) => {
              if (row.FullName && row.Key) teamMapObj[row.FullName] = row.Key;
            });
            setTeams(cleanTeams);
            setTeamMap(teamMapObj);
          },
        });
      });

    fetch('/cleaned_nfl_data.csv')
      .then((response) => response.text())
      .then((csv) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const playerRows = results.data
              .filter((row) => row.PlayerID && row.Name)
              .map((row) => ({
                ...row,
                pass_yds: parseFloat(row.pass_yds || 0),
                rush_yds: parseFloat(row.rush_yds || 0),
                recv_yds: parseFloat(row.recv_yds || 0),
                tds: parseFloat(row.tds || 0),
                fumbles: parseFloat(row.fumbles || 0),
                total_yards: parseFloat(row.total_yards || 0),
              }))
              .sort((a, b) => a.Name.localeCompare(b.Name));
            setPlayers(playerRows);
          },
        });
      });
  }, []);

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return players.slice(0, 10);
    return players
      .filter((player) =>
        player.Name.toLowerCase().includes(playerSearch.toLowerCase()) ||
        player.Team.toLowerCase().includes(playerSearch.toLowerCase()) ||
        (player.Position || '').toLowerCase().includes(playerSearch.toLowerCase())
      )
      .slice(0, 10);
  }, [playerSearch, players]);

  const positionOptions = useMemo(() => {
    const position = selectedPlayer?.Position || 'QB';
    return STAT_OPTIONS[position] || STAT_OPTIONS.QB;
  }, [selectedPlayer]);

  const activeStat = useMemo(() => {
    const current = positionOptions.find((item) => item.value === statType);
    return current || positionOptions[0];
  }, [positionOptions, statType]);

  useEffect(() => {
    if (!positionOptions.some((item) => item.value === statType)) {
      setStatType(positionOptions[0]?.value || 'passingYards');
    }
  }, [positionOptions, statType]);

  useEffect(() => {
    if (threshold > (activeStat?.max || 400)) {
      setThreshold(activeStat?.max || 100);
    }
  }, [activeStat, threshold]);

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setPlayerSearch(player.Name);
    setShowPlayerDropdown(false);
    setSelectedTeam(player.Team || '');
  };

  const handlePredict = () => {
    if (!selectedPlayer || !selectedTeam) return;
    
    const opponentKey = teamMap[selectedTeam];
    const defense = MOCK_DEFENSE[opponentKey] || { passRank: 20, rushRank: 20, sacksAllowed: 2.5 };
    
    // Step 1: Calculate season average
    const totalStat = getDerivedStat(selectedPlayer, statType);
    const seasonAvg = computeAverage(totalStat, 17);
    
    // Step 2: Since we only have season totals, use season average as base
    // No separate "recent" calculation since we don't have per-game data
    
    // Step 3: Calculate standard deviation
    const stdDev = estimateStdDev(seasonAvg, statType);
    
    // Step 4: Apply opponent defensive adjustment
    const defenseAdj = getDefenseAdjustment(defense, statType);
    const defenseAdjustedAvg = seasonAvg * (1 + defenseAdj);
    
    // Step 5: Apply location adjustment
    const locationAdj = getLocationAdjustment(location);
    const locationAdjustedAvg = defenseAdjustedAvg * (1 + locationAdj);
    
    // Step 6: Use the adjusted season average as predicted performance
    const predictedPerformance = locationAdjustedAvg;
    
    // Step 7: Apply injury and weather modifiers
    const injuryModifier = injuryImpact ? 0.9 : 1.0;
    const weatherModifier = weatherImpact ? 0.95 : 1.0;
    const finalPredictedPerformance = predictedPerformance * injuryModifier * weatherModifier;
    
    // Step 8: Calculate probability of exceeding threshold
    const probability = calculateThresholdProbability(finalPredictedPerformance, stdDev, threshold);
    
    setPrediction({
      player: selectedPlayer,
      opponent: selectedTeam,
      statType,
      threshold,
      probability,
      defense,
      timeframe,
      location,
      weatherImpact,
      injuryImpact,
      seasonAvg,
      recentAvg: seasonAvg, // Use season avg as recent for display purposes
      predictedPerformance: Math.round(finalPredictedPerformance * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
    });
  };

  const handleTeamPredict = () => {
    if (!awayTeam || !homeTeam || awayTeam === homeTeam) return;
    const awayKey = teamMap[awayTeam];
    const homeKey = teamMap[homeTeam];
    const awayOffense = MOCK_OFFENSE[awayKey] || { passRank: 16, rushRank: 16, pointsPerGame: 22 };
    const homeOffense = MOCK_OFFENSE[homeKey] || { passRank: 16, rushRank: 16, pointsPerGame: 22 };
    const awayDefense = MOCK_DEFENSE[awayKey] || { passRank: 16, rushRank: 16, sacksAllowed: 2.5 };
    const homeDefense = MOCK_DEFENSE[homeKey] || { passRank: 16, rushRank: 16, sacksAllowed: 2.5 };

    // Combined strength: offensive rank (inverted) + defensive rank (inverted)
    const awayOffenseStrength = (33 - awayOffense.passRank) + (33 - awayOffense.rushRank);
    const awayDefenseStrength = (33 - awayDefense.passRank) + (33 - awayDefense.rushRank);
    const awayTotal = awayOffenseStrength + awayDefenseStrength;

    const homeOffenseStrength = (33 - homeOffense.passRank) + (33 - homeOffense.rushRank);
    const homeDefenseStrength = (33 - homeDefense.passRank) + (33 - homeDefense.rushRank);
    const homeTotal = homeOffenseStrength + homeDefenseStrength + 4; // home advantage

    const totalStrength = awayTotal + homeTotal;
    const awayProb = Math.round((awayTotal / totalStrength) * 100);
    const homeProb = 100 - awayProb;

    setTeamPrediction({
      awayTeam,
      homeTeam,
      awayProb: Math.max(5, Math.min(95, awayProb)),
      homeProb: Math.max(5, Math.min(95, homeProb)),
    });
  };

  const last5Avg = selectedPlayer ? computeAverage(getDerivedStat(selectedPlayer, statType), 5) : 0;
  const seasonAvg = selectedPlayer ? computeAverage(getDerivedStat(selectedPlayer, statType), 17) : 0;

  const trendData = useMemo(() => {
    if (!selectedPlayer) return { percentage: 0, direction: 'Neutral', color: 'bg-slate-500' };
    const diff = last5Avg - seasonAvg;
    const percentage = Math.round((diff / Math.max(seasonAvg, 1)) * 100);
    let direction, color;
    if (percentage > 5) {
      direction = 'Upward momentum';
      color = 'bg-emerald-500';
    } else if (percentage < -5) {
      direction = 'Downward trend';
      color = 'bg-red-500';
    } else {
      direction = 'Stable performance';
      color = 'bg-amber-500';
    }
    return { percentage, direction, color };
  }, [selectedPlayer, last5Avg, seasonAvg]);

  const breakdownThresholds = useMemo(() => {
    if (!selectedPlayer || !prediction) return [];
    const { predictedPerformance, stdDev } = prediction;
    const baseThresholds = activeStat.unit === 'TDs' ? [1, 2, 3, 4] : [150, 200, 250, 300];
    return baseThresholds.map((value) => {
      const pct = calculateThresholdProbability(predictedPerformance, stdDev, value);
      return { label: `${value}${activeStat.unit === 'TDs' ? '+' : '+'}`, value, pct };
    });
  }, [selectedPlayer, activeStat, prediction]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Tab Navigation */}
        <nav className="flex space-x-1 rounded-3xl bg-slate-900/50 p-1">
          {['Home', 'Teams', 'Players', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === 'Home' && (
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400/80">Welcome to NFL Analytics</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Predict Games & Players</h1>
              <p className="mt-2 text-slate-400">Use advanced analytics to predict NFL outcomes. Switch to Teams for matchups or Players for props.</p>
            </div>
          </section>
        )}

        {activeTab === 'Teams' && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-400/80">Team Matchup Predictor</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Predict game outcomes</h1>
                  <p className="mt-2 max-w-2xl text-slate-400">Select two teams to generate a win probability based on offensive and defensive rankings.</p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Away Team</label>
                    <select
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                    >
                      <option value="">Select away team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Home Team</label>
                    <select
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                    >
                      <option value="">Select home team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleTeamPredict}
                    className="w-full rounded-3xl bg-sky-500 px-6 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-sky-500/20 transition hover:bg-sky-400"
                  >
                    Predict Winner
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
                {teamPrediction ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Matchup Result</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">{teamPrediction.awayTeam} @ {teamPrediction.homeTeam}</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl bg-slate-950/90 p-5 text-center">
                        <p className="text-lg font-semibold text-white">{teamPrediction.awayTeam}</p>
                        <p className="text-3xl font-bold text-sky-400">{teamPrediction.awayProb}%</p>
                        <p className="text-sm text-slate-400">Win Probability</p>
                      </div>
                      <div className="rounded-3xl bg-slate-950/90 p-5 text-center">
                        <p className="text-lg font-semibold text-white">{teamPrediction.homeTeam}</p>
                        <p className="text-3xl font-bold text-sky-400">{teamPrediction.homeProb}%</p>
                        <p className="text-sm text-slate-400">Win Probability</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    Select away and home teams and click Predict Winner to see the result.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Players' && (
          <>
            <section className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-400/80">Player Props Dashboard</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Predict player performance like a pro</h1>
                  <p className="mt-2 max-w-2xl text-slate-400">Select a player, opponent, stat, and threshold to generate a probability result in a modern analytics interface.</p>
                </div>
                <div className="grid w-full gap-3 sm:max-w-md xl:w-auto xl:grid-cols-1">
                  <div className="rounded-2xl bg-slate-950/80 p-4 shadow-xl shadow-slate-950/20">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Active configuration</p>
                    <p className="mt-3 text-lg font-semibold text-white">{selectedPlayer ? selectedPlayer.Name : 'No player selected'}</p>
                    <p className="mt-1 text-sm text-slate-400">{selectedPlayer ? `${selectedPlayer.Position} • ${selectedPlayer.Team}` : 'Choose a player from the search dropdown'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Search player</label>
                <div className="relative">
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => {
                      setPlayerSearch(e.target.value);
                      setShowPlayerDropdown(true);
                    }}
                    onFocus={() => setShowPlayerDropdown(true)}
                    placeholder="Search by player, team, or position"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 transition focus:border-sky-400 focus:ring-sky-500/40"
                  />
                  {showPlayerDropdown && filteredPlayers.length > 0 && (
                    <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950/95 shadow-xl backdrop-blur-xl">
                      {filteredPlayers.map((player) => (
                        <button
                          key={`${player.PlayerID}-${player.Team}`}
                          type="button"
                          className="w-full px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                          onClick={() => handleSelectPlayer(player)}
                        >
                          <div className="font-medium">{player.Name}</div>
                          <div className="text-xs text-slate-500">{player.Position} • {player.Team}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-300">Position</label>
                  <input
                    value={selectedPlayer?.Position || ''}
                    readOnly
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                    placeholder="Auto-fill position"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Team</label>
                  <input
                    value={selectedPlayer?.Team || ''}
                    readOnly
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                    placeholder="Auto-fill team"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Player info</p>
                {selectedPlayer ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xl font-semibold text-white">{selectedPlayer.Name}</p>
                    <p className="text-sm text-slate-400">{selectedPlayer.Position} • {selectedPlayer.Team}</p>
                    <p className="mt-3 text-slate-200">Avg: <span className="font-semibold text-white">{seasonAvg} {activeStat.unit}</span> {activeStat.label}</p>
                    <p className="text-slate-400">Active threshold: <span className="font-semibold text-white">{threshold}{activeStat.unit}</span></p>
                  </div>
                ) : (
                  <p className="mt-4 text-slate-500">Select a player to see updated season averages and available stat types.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-300">Opponent team</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                  >
                    <option value="">Select opponent</option>
                    {teams.map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Stat type</label>
                  <select
                    value={statType}
                    onChange={(e) => setStatType(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                  >
                    {positionOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Threshold selector</p>
                    <p className="mt-2 text-lg font-semibold text-white">{threshold} {activeStat.unit}</p>
                  </div>
                  <div className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sky-400">Custom</div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {THRESHOLD_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setThreshold(Math.min(value, activeStat.max))}
                      className={`rounded-2xl border px-3 py-2 text-sm transition ${threshold === value ? 'border-sky-400 bg-sky-500/20 text-sky-200' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:bg-slate-800'}`}
                    >
                      {value}+
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <input
                    type="range"
                    min="0"
                    max={activeStat.max}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>0</span>
                    <span>{activeStat.max} {activeStat.unit}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-slate-100"
                >
                  <span className="text-sm font-medium">Advanced Settings</span>
                  <span className="text-slate-400">{showAdvancedSettings ? 'Hide' : 'Show'}</span>
                </button>
                {showAdvancedSettings && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-300">Time frame</label>
                        <select
                          value={timeframe}
                          onChange={(e) => setTimeframe(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                        >
                          <option>Last 3 games</option>
                          <option>Last 5 games</option>
                          <option>Full season</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300">Game location</label>
                        <select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                        >
                          <option>Home</option>
                          <option>Away</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={weatherImpact}
                          onChange={(e) => setWeatherImpact(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-sky-500"
                        />
                        <span className="text-sm text-slate-200">Weather impact</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={injuryImpact}
                          onChange={(e) => setInjuryImpact(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-sky-500"
                        />
                        <span className="text-sm text-slate-200">Injury impact</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handlePredict}
                className="mt-3 w-full rounded-3xl bg-sky-500 px-6 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-sky-500/20 transition hover:bg-sky-400"
              >
                Predict Probability
              </button>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-5 shadow-glow">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Opponent defense</p>
              {selectedTeam ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Pass defense rank</span>
                    <span>{MOCK_DEFENSE[teamMap[selectedTeam]]?.passRank ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Rush defense rank</span>
                    <span>{MOCK_DEFENSE[teamMap[selectedTeam]]?.rushRank ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Sacks allowed</span>
                    <span>{MOCK_DEFENSE[teamMap[selectedTeam]]?.sacksAllowed ?? '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-slate-500">Pick an opponent team to load mock defense stats.</p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-5 shadow-glow">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Trend snapshot</p>
              <div className="mt-4 flex items-center gap-3 text-white">
                <div className={`rounded-2xl ${trendData.color}/10 px-3 py-2 text-sm font-semibold text-${trendData.color.replace('bg-', '')}-300`}>
                  {trendData.percentage > 0 ? '+' : ''}{trendData.percentage}%
                </div>
                <div>
                  <p className="text-sm text-slate-300">Last 5 game trend</p>
                  <p className="text-lg font-semibold">{trendData.direction}</p>
                </div>
              </div>
              <div className="mt-5 h-28 rounded-3xl bg-slate-950 p-3">
                <div className="relative h-full">
                  <div className="absolute left-3 bottom-3 h-1 w-10 rounded-full bg-sky-500"></div>
                  <div className="absolute left-16 bottom-6 h-1 w-10 rounded-full bg-slate-600"></div>
                  <div className="absolute left-28 bottom-12 h-1 w-8 rounded-full bg-slate-500"></div>
                  <div className="absolute left-40 bottom-9 h-1 w-12 rounded-full bg-sky-400"></div>
                  <div className="absolute left-56 bottom-16 h-1 w-14 rounded-full bg-emerald-400"></div>
                  <div className="absolute left-72 bottom-12 h-1 w-10 rounded-full bg-sky-300"></div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Prediction output</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Player props result</h2>
              </div>
              <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-sm text-slate-300">Model confidence engine</div>
            </div>

            {prediction ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Matchup</p>
                  <p className="mt-2 text-xl font-semibold text-white">{prediction.player.Name} vs {prediction.opponent}</p>
                  <p className="text-slate-400">{getStatLabel(prediction.statType)}: {prediction.threshold}{activeStat.unit}</p>

                  <div className="mt-5 rounded-3xl bg-slate-800/90 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>Probability</span>
                      <span className="font-semibold text-white">{prediction.probability}%</span>
                    </div>
                    <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-800">
                      <div className={`${probabilityColor(prediction.probability)} h-full rounded-full`} style={{ width: `${prediction.probability}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Supporting stats</p>
                    <div className="mt-4 space-y-3 text-slate-300">
                      <div className="flex items-center justify-between"><span>Last 5 game avg</span><span className="font-medium text-white">{prediction.recentAvg} {activeStat.unit}</span></div>
                      <div className="flex items-center justify-between"><span>Season avg</span><span className="font-medium text-white">{prediction.seasonAvg} {activeStat.unit}</span></div>
                      <div className="flex items-center justify-between"><span>Predicted performance</span><span className="font-medium text-white">{prediction.predictedPerformance} {activeStat.unit}</span></div>
                      <div className="flex items-center justify-between"><span>Std deviation</span><span className="font-medium text-white">{prediction.stdDev}</span></div>
                      <div className="flex items-center justify-between"><span>Opponent pass rank</span><span className="font-medium text-white">{prediction.defense.passRank}</span></div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Threshold breakdown</p>
                    <div className="mt-4 space-y-3">
                      {breakdownThresholds.map((item) => (
                        <div key={item.value} className="rounded-2xl bg-slate-900/90 p-3">
                          <div className="flex items-center justify-between text-sm text-slate-300">
                            <span>{item.label}</span>
                            <span className="font-semibold text-white">{item.pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-8 text-center text-slate-500">
                Pick a player, opponent and stat threshold, then hit Predict Probability to see a prediction result.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Data view</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl bg-slate-950/90 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Selected player</p>
                <p className="mt-3 text-base text-white">{selectedPlayer ? selectedPlayer.Name : 'None'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/90 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Stat target</p>
                <p className="mt-3 text-base text-white">{getStatLabel(statType)} • {threshold}{activeStat.unit}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/90 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Opponent</p>
                <p className="mt-3 text-base text-white">{selectedTeam || 'Not selected'}</p>
              </div>
            </div>
          </div>
        </section>
          </>
        )}

        {activeTab === 'About' && (
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-glow backdrop-blur-xl">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400/80">About</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">NFL Prediction Tool</h1>
              <p className="mt-2 text-slate-400">Built with React and Tailwind CSS. Data sourced from NFL stats. For entertainment purposes only.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
