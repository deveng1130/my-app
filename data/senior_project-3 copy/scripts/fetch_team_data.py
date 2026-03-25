import requests
import pandas as pd
import os

API_KEY = os.getenv("SPORTSDATA_KEY")
BASE_URL = "https://api.sportsdata.io/v3/nfl"


data_dir = os.path.join(os.path.dirname(__file__), "../data")
os.makedirs(data_dir, exist_ok=True)

# Fetch Basic Team Info 
def get_teams():
    url = f"{BASE_URL}/scores/json/Teams?key={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        df = pd.DataFrame(response.json())
        df.to_csv(os.path.join(data_dir, "teams.csv"), index=False)
        print("Saved teams.csv")
    else:
        print(f"Error {response.status_code}: {response.text}")

#  Fetch Team Schedules 
def get_schedules(season=2024):
    url = f"{BASE_URL}/scores/json/Schedules/{season}?key={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        df = pd.DataFrame(response.json())
        df.to_csv(os.path.join(data_dir, f"team_schedules_{season}.csv"), index=False)
        print(f"Saved team_schedules_{season}.csv")
    else:
        print(f"Error {response.status_code}: {response.text}")

# Run both
get_teams()
get_schedules(2024)

