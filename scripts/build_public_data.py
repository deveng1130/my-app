import os
import sys
from typing import Dict, List, Optional

import pandas as pd
import requests


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(ROOT, "public")

# Source data (already in this repo)
LOCAL_DATA_DIR = os.path.join(ROOT, "data", "senior_project-3 copy", "data")

# SportsDataIO (optional, if SPORTSDATA_KEY is set)
SPORTSDATA_KEY = os.getenv("SPORTSDATA_KEY")
SPORTSDATA_BASE_URL = "https://api.sportsdata.io/v3/nfl"


def _ensure_public_dir() -> None:
    os.makedirs(PUBLIC_DIR, exist_ok=True)


def _read_weekly_player_stats_csvs(season: int) -> pd.DataFrame:
    frames: List[pd.DataFrame] = []
    for week in range(1, 19):
        path = os.path.join(LOCAL_DATA_DIR, f"player_stats_week{week}_{season}.csv")
        if not os.path.exists(path):
            continue
        df = pd.read_csv(path, low_memory=False)
        frames.append(df)
    if not frames:
        raise FileNotFoundError(
            f"No weekly player stats found in {LOCAL_DATA_DIR} for season={season}."
        )
    return pd.concat(frames, ignore_index=True)


def build_player_game_logs(season: int) -> str:
    """
    Produces a smaller CSV tailored for the React app's prediction features:
    - per-game stats by player + team + week
    - includes both offensive and defensive columns the UI uses
    """
    _ensure_public_dir()
    df = _read_weekly_player_stats_csvs(season)

    # Normalize/derive only what the UI needs
    needed = {
        "PlayerID": "PlayerID",
        "Name": "Name",
        "Team": "Team",
        "Position": "Position",
        "Week": "Week",
        "GameDate": "GameDate",
        "Opponent": "Opponent",
        "HomeOrAway": "HomeOrAway",
        "PassingYards": "PassingYards",
        "PassingTouchdowns": "PassingTouchdowns",
        "PassingInterceptions": "PassingInterceptions",
        "RushingYards": "RushingYards",
        "RushingTouchdowns": "RushingTouchdowns",
        "ReceivingYards": "ReceivingYards",
        "Receptions": "Receptions",
        "ReceivingTouchdowns": "ReceivingTouchdowns",
        "SoloTackles": "SoloTackles",
        "AssistedTackles": "AssistedTackles",
        "Sacks": "Sacks",
        "FumblesForced": "FumblesForced",
        "Interceptions": "Interceptions",
        "DeclaredInactive": "DeclaredInactive",
        "Played": "Played",
        "Started": "Started",
    }

    present = [col for col in needed.keys() if col in df.columns]
    out = df[present].copy()
    out.rename(columns={k: v for k, v in needed.items() if k in present}, inplace=True)

    # Coerce numeric columns
    numeric_cols = [
        "Week",
        "PassingYards",
        "PassingTouchdowns",
        "PassingInterceptions",
        "RushingYards",
        "RushingTouchdowns",
        "ReceivingYards",
        "Receptions",
        "ReceivingTouchdowns",
        "SoloTackles",
        "AssistedTackles",
        "Sacks",
        "FumblesForced",
        "Interceptions",
        "DeclaredInactive",
        "Played",
        "Started",
    ]
    for c in numeric_cols:
        if c in out.columns:
            out[c] = pd.to_numeric(out[c], errors="coerce").fillna(0)

    if "SoloTackles" in out.columns or "AssistedTackles" in out.columns:
        out["Tackles"] = out.get("SoloTackles", 0) + out.get("AssistedTackles", 0)
    else:
        out["Tackles"] = 0

    # Keep consistent schema even if some columns were missing upstream
    for c in [
        "PlayerID",
        "Name",
        "Team",
        "Position",
        "Week",
        "PassingYards",
        "PassingTouchdowns",
        "PassingInterceptions",
        "RushingYards",
        "RushingTouchdowns",
        "ReceivingYards",
        "Receptions",
        "ReceivingTouchdowns",
        "Tackles",
        "Sacks",
        "FumblesForced",
        "Interceptions",
        "Opponent",
        "HomeOrAway",
        "GameDate",
        "DeclaredInactive",
        "Played",
        "Started",
    ]:
        if c not in out.columns:
            out[c] = 0

    # Sort by player/week so the app can easily take "last N"
    out.sort_values(["PlayerID", "Team", "Week"], inplace=True)

    out_path = os.path.join(PUBLIC_DIR, f"player_game_logs_{season}.csv")
    out.to_csv(out_path, index=False)
    return out_path


def _sportsdata_get(url: str) -> object:
    if not SPORTSDATA_KEY:
        raise RuntimeError("SPORTSDATA_KEY is not set.")
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    return res.json()


def build_team_season_ranks(season: int) -> Optional[str]:
    """
    Pulls TeamSeasonStats from SportsDataIO (requires SPORTSDATA_KEY) and computes
    simple offense/defense ranks used by the UI.
    """
    if not SPORTSDATA_KEY:
        return None

    _ensure_public_dir()

    url = f"{SPORTSDATA_BASE_URL}/scores/json/TeamSeasonStats/{season}?key={SPORTSDATA_KEY}"
    data = _sportsdata_get(url)
    df = pd.DataFrame(data)
    if df.empty:
        return None

    # Try to map common field names; keep it resilient across plan/tier differences.
    # Defense (lower is better)
    pass_against = None
    rush_against = None
    for c in ["PassingYardsAgainst", "OpponentPassingYards"]:
        if c in df.columns:
            pass_against = c
            break
    for c in ["RushingYardsAgainst", "OpponentRushingYards"]:
        if c in df.columns:
            rush_against = c
            break

    # Offense (higher is better)
    points_for = None
    for c in ["PointsFor", "Score", "Points"]:
        if c in df.columns:
            points_for = c
            break
    games = "Games" if "Games" in df.columns else None

    # Ensure Team key
    team_col = "Team" if "Team" in df.columns else ("TeamKey" if "TeamKey" in df.columns else None)
    if not team_col:
        return None

    out = pd.DataFrame()
    out["Team"] = df[team_col]

    if pass_against:
        out["PassYdsAgainst"] = pd.to_numeric(df[pass_against], errors="coerce").fillna(0)
    else:
        out["PassYdsAgainst"] = 0

    if rush_against:
        out["RushYdsAgainst"] = pd.to_numeric(df[rush_against], errors="coerce").fillna(0)
    else:
        out["RushYdsAgainst"] = 0

    if points_for and games:
        pf = pd.to_numeric(df[points_for], errors="coerce").fillna(0)
        g = pd.to_numeric(df[games], errors="coerce").replace(0, 1).fillna(1)
        out["PointsPerGame"] = (pf / g).round(2)
    else:
        out["PointsPerGame"] = 0

    # Compute ranks (1 = best)
    out["passRank"] = out["PassYdsAgainst"].rank(method="min", ascending=True).astype(int)
    out["rushRank"] = out["RushYdsAgainst"].rank(method="min", ascending=True).astype(int)

    out_path = os.path.join(PUBLIC_DIR, f"team_season_ranks_{season}.csv")
    out.to_csv(out_path, index=False)
    return out_path


def main() -> int:
    season = int(os.getenv("NFL_SEASON", "2025"))

    print(f"Building public datasets for season {season}...")
    logs_path = build_player_game_logs(season)
    print(f"- Wrote {logs_path}")

    ranks_path = build_team_season_ranks(season)
    if ranks_path:
        print(f"- Wrote {ranks_path}")
    else:
        print("- Skipped team season ranks (SPORTSDATA_KEY not set or no data)")

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

