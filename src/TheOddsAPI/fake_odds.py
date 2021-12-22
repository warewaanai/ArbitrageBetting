from datetime import datetime
from typing import List
import random
import json

from structures import BundledOdds, Bundle, sports



def get_odds(
        game        : str,
        region      : str,
        api_query   : str,
        description : str,
    ) -> List[Bundle]:

    if game != 'Soccer' or region != 'eu':
        return []

    bookmakers = ['betnet', 'betclic', 'pinnacle', 'betfair', 'marathonbet', 'unibet', 'mybookieag']
    teams = ['Steaua', 'Dinamo', 'FC Pula']

    bundles = []
    for team1 in teams:
        for team2 in teams:
            if team1 >= team2:
                continue

            start = "2022-01-16T00:00:00.000"
            events = [team1, team2]
            markets = []
            name = f'{team1} vs {team2}'
            for bookmaker in bookmakers:
                if random.random() < 0.8:
                    continue
                markets.append(BundledOdds(
                    bookmaker,
                    'eu',
                    [2 + 5 * random.random(), 2 + 5 * random.random()],
                    datetime.fromisoformat(start),
                    datetime.now()
                ))

            bundles.append(Bundle(
                name,
                description,
                api_query,
                datetime.fromisoformat(start),
                events,
                game,
                markets
            ))

    return bundles


def get_all_bundles(
        games : List[str] = sports,
        regions : List[str] = ['eu']
    ) -> List[Bundle]:

    events = json.loads(open('active_sports.json', "r").read())["data"]

    bundles : List[Bundle] = []
    for region in regions:
        for event in events:
            if event["group"] in games:
                bundles+= get_odds(event["group"], region, event["key"], f'{event["title"]} ({event["description"]})')

    return bundles

def get_bundles(
        keys : List[str],
        regions : List[str]
    ) -> List[Bundle]:

    return []
