from datetime import datetime
from typing import List
import requests
import json
import os

from structures import BundledOdds, Bundle, sports


def extract_bundle(api_query : str, sport : str, region : str, description: str, raw_bundle : dict):
    name    = f'{raw_bundle["home_team"]} vs {raw_bundle["away_team"]}'
    start   = datetime.fromisoformat(raw_bundle["commence_time"][:-1])

    events : List[str] = []
    if len(raw_bundle["bookmakers"]) != 0:
        for market in raw_bundle["bookmakers"][0]["markets"][0]["outcomes"]:
            events.append(market["name"])
        events.sort()

    markets : List[BundledOdds] = []
    for bookmaker in raw_bundle["bookmakers"]:
        for market in bookmaker["markets"]:
            if market["key"] == 'h2h':
                market["outcomes"].sort(key = (lambda raw : raw["name"]))
                if [outcome["name"] for outcome in market["outcomes"]] != events:
                    continue

                markets.append(BundledOdds(
                    bookmaker["key"],
                    region,
                    [float(outcome["price"]) for outcome in market["outcomes"]],
                    start,
                    datetime.fromisoformat(bookmaker["last_update"][:-1])
                ))

    return Bundle(name, description, api_query, start, events, sport, markets)


def get_odds(
        game        : str,
        region      : str,
        api_query   : str,
        description : str,
    ) -> List[Bundle]:
    
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

    bundles : List[Bundle] = []
    for raw_bundle in req.json():
        try:
            bundles.append(extract_bundle(api_query, game, region, description, raw_bundle))
        except:
            pass

    return bundles
