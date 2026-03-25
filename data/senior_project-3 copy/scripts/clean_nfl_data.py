import os
import pandas as pd

# Create and access data folder
data_dir = os.path.join(os.path.dirname(__file__), "../data")
os.makedirs(data_dir, exist_ok=True)

# Load all player stats files
all_players = []
for week in range(1, 19):
    week_path = os.path.join(data_dir, f"player_stats_week{week}_2025.csv")
    if os.path.exists(week_path):
        df = pd.read_csv(week_path)
        all_players.append(df)

if all_players:
    players = pd.concat(all_players, ignore_index=True)
else:
    print("No player data found")
    exit()

# Load teams
teams_path = os.path.join(data_dir, "teams.csv")
teams = pd.read_csv(teams_path)

# Aggregate by player (sum stats across weeks)
players_agg = players.groupby(['PlayerID', 'Name', 'Team']).agg({
    'PassingYards': 'sum',
    'RushingYards': 'sum',
    'ReceivingYards': 'sum',
    'Touchdowns': 'sum',
    'FumblesLost': 'sum'
}).reset_index()

players = players_agg

# Keep only important columns
columns = [
    'PlayerID', 'Name', 'Team', 
    'PassingYards', 'RushingYards', 'ReceivingYards', 
    'Touchdowns', 'FumblesLost'
]
players = players[columns]

# Fill missing values
players.fillna(0, inplace=True)

# Rename for clarity
players.rename(columns={
    'PassingYards': 'pass_yds',
    'RushingYards': 'rush_yds',
    'ReceivingYards': 'recv_yds',
    'Touchdowns': 'tds',
    'FumblesLost': 'fumbles'
}, inplace=True)

# Add new features
players['total_yards'] = players['pass_yds'] + players['rush_yds'] + players['recv_yds']
players['efficiency'] = players['tds'] / (players['total_yards'] + 1)

# Merge with team data (if available)
if 'Team' in teams.columns:
    merged = pd.merge(players, teams, on='Team', how='left')
else:
    merged = players

# Save cleaned data
cleaned_path = os.path.join(data_dir, "cleaned_nfl_data.csv")
merged.to_csv(cleaned_path, index=False)

print(f"✅ Cleaned data saved to {cleaned_path}")

