from datetime import datetime
import requests
import json
import os

def get_active_sports(cached : bool = True) -> dict:
    API_KEY = os.getenv('API_KEY')

    if cached:
        with open("active_sports.json", "r") as fi:
            res = json.loads(fi.read())
            fi.close()
            return res
    else:
        sports_response = requests.get(
            'https://api.the-odds-api.com/v4/sports',
            params={
                'api_key': API_KEY
            }
        )

        return sports_response.json()

def update_active_sports():
    active_sports = get_active_sports(cached = False)
    with open("active_sports.json", "w") as fo:
        fo.write(json.dumps({
            'lastupdate': datetime.utcnow().isoformat(),
            'data': active_sports
        }))
        fo.close()
