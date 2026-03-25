import pandas as pd
import os

# Paths
data_dir = os.path.join(os.path.dirname(__file__), "../data")
teams_path = os.path.join(data_dir, "teams.csv")
schedules_path = os.path.join(data_dir, "team_schedules_2024.csv")

# ✅ Load both CSVs
teams_df = pd.read_csv(teams_path)
schedules_df = pd.read_csv(schedules_path)

# ✅ Get all unique teams from both columns in schedules
all_team_keys = pd.concat([schedules_df["HomeTeam"], schedules_df["AwayTeam"]]).dropna().unique()
all_team_keys.sort()

print(f"Found {len(all_team_keys)} unique teams in schedule file.")

# ✅ Filter teams_df to only include those from schedule
merged_df = teams_df[teams_df["Key"].isin(all_team_keys)]

# ✅ Find any missing teams (teams in schedule but not in teams.csv)
missing = set(all_team_keys) - set(merged_df["Key"])
if missing:
    print("⚠️ Missing team entries:", missing)
else:
    print("✅ All teams found!")

# ✅ Save the clean, full team list
output_path = os.path.join(data_dir, "all_teams.csv")
merged_df.to_csv(output_path, index=False)
print(f"✅ Saved full list to {output_path}")

