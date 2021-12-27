from datetime import datetime
from typing import Dict, List
import requests
import json
import os

from structures import OddsBundle, Odds, Market, Bookmaker, Outcome


def extract_bundle(api_query : str, sport : str, region : str, description: str, raw_bundle : dict) -> OddsBundle:
    name    = f'{raw_bundle["home_team"]} vs {raw_bundle["away_team"]}'
    start   = datetime.fromisoformat(raw_bundle["commence_time"][:-1])

    bookmakers : List[Bookmaker] = []
    outcomes : List[str] = []

    if len(raw_bundle["bookmakers"]) != 0:
        for market in raw_bundle["bookmakers"][0]["markets"][0]["outcomes"]:
            outcomes.append(market["name"])
        outcomes.sort()

    markets : Dict[Bookmaker, Market] = {}

    for raw_bookmaker in raw_bundle["bookmakers"]:
        odds : Dict[Outcome, Odds] = {}
        last_update = datetime.fromisoformat(raw_bookmaker["last_update"][:-1])
        
        for raw_market in raw_bookmaker["markets"]:
            if raw_market["key"] != 'h2h':
                continue
            raw_market["outcomes"].sort(key = (lambda raw : raw["name"]))
            if [outcome["name"] for outcome in raw_market["outcomes"]] != outcomes:
                continue
            
            bookmaker = Bookmaker(raw_bookmaker["title"], region)
            if bookmaker.name.lower() == 'betclic':
                continue

            bookmakers.append(bookmaker)
            for raw_outcome in raw_market["outcomes"]:
                outcome = raw_outcome["name"]
                odds[outcome] = Odds(
                    outcome,
                    float(raw_outcome["price"]),
                    last_update
                )

            markets[bookmaker] = Market(
                raw_bookmaker["title"],
                outcomes,
                odds,
                active=True
            )

    return OddsBundle(name, description, api_query, start, outcomes, sport, markets)
 

def get_odds(
        game        : str,
        region      : str,
        api_query   : str,
        description : str,
    ) -> List[OddsBundle]:
    
    try:
        API_KEY = os.getenv('API_KEY')

        req = requests.get(
            f'https://api.the-odds-api.com/v4/sports/{api_query}/odds/',
            params = {
                'api_key': API_KEY,
                'regions': region,
                'markets': 'h2h'
            }
        )

        if not req.ok:
            return []
            
        bundles : List[OddsBundle] = []
        for raw_bundle in req.json():
            try:
                bundles.append(extract_bundle(api_query, game, region, description, raw_bundle))
            except:
                pass

        return bundles
    except:
        return[]

#    print('Remaining requests: ', req.headers['x-requests-remaining'])

