import requests
import pandas as pd
import os
import time

# ----------------------------
# CONFIGURATION
# ----------------------------
API_KEY = os.getenv("SPORTSDATA_KEY")
BASE_URL = "https://api.sportsdata.io/v3/nfl"
SEASON = 2025
DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")

# Make sure data folder exists
os.makedirs(DATA_DIR, exist_ok=True)

# List to store data from all weeks
all_weeks_data = []

print(f"🏈 Starting NFL data download for {SEASON} season...\n")

# ----------------------------
# LOOP THROUGH WEEKS 1–18
# ----------------------------
for week in range(1, 19):
    print(f"📅 Fetching Week {week} data...")
    url = f"{BASE_URL}/stats/json/PlayerGameStatsByWeek/{SEASON}/{week}?key={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        week_data = response.json()

        if week_data:  # only process if data is not empty
            df = pd.DataFrame(week_data)
            df["Week"] = week
            all_weeks_data.append(df)

            week_path = os.path.join(DATA_DIR, f"player_stats_week{week}_{SEASON}.csv")
            df.to_csv(week_path, index=False)
            print(f"✅ Saved Week {week} data to {week_path}\n")
        else:
            print(f"⚠️ No data found for Week {week}\n")

    elif response.status_code == 401:
        print(f"🚫 Unauthorized for Week {week}. Check your API plan or key.\n")
        break
    elif response.status_code == 403:
        print(f"🚫 Forbidden (Week {week}) — You might not have access to that season.\n")
        break
    elif response.status_code == 404:
        print(f"❌ Week {week} data not found (404). Skipping.\n")
    else:
        print(f"❌ Failed to fetch Week {week}. HTTP {response.status_code}: {response.text}\n")

    # Avoid hitting API rate limits
    time.sleep(1.5)

# ----------------------------
#

