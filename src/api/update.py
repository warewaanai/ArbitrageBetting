import sqlite3
import json
from typing import List
from datetime import datetime

import TheOddsAPI.odds
import TheOddsAPI.sports
from structures import Bundle

import api.query


def update_active_sports():
    TheOddsAPI.sports.update_active_sports()


def update(
        keys : List[str],
        regions : List[str] = ['eu'],
        ):

    new_bundles = []

    events = json.loads(open('active_sports.json', "r").read())["data"]
    for region in regions:
        for event in events:
            if event["key"] in keys:
                new_bundles+= TheOddsAPI.odds.get_odds(event["group"], region, event["key"], f'{event["title"]} ({event["description"]})')
    
    conn_active = sqlite3.connect("active.db")
    conn_archive = sqlite3.connect("historical.db")
    for bundle in new_bundles:
        bundle.register(conn_active, conn_archive)

    conn_active.commit()
    conn_active.close()

    conn_archive.commit()
    conn_archive.close()

def update_best():
    print("Running bestarb update...")
    conn_active = sqlite3.connect("active.db")
    update_keys : List[str] = []
    cur_active = conn_active.cursor()
    cur_active.execute("SELECT * FROM ODDS_BUNDLE WHERE REVENUE > 0.8;")
    raw_bundles = [raw_bundle for raw_bundle in cur_active.fetchall()]
    for raw_bundle in raw_bundles:
        bundle = Bundle.from_row(conn_active, raw_bundle)
        update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))
    conn_active.close()

    update(update_keys)
    print("Bestarbs update completed")


def update_live():
    print("Running live update...")

    # fetch the update keys you need
    conn_active = sqlite3.connect("active.db")
    time_now = datetime.now()
    update_keys : List[str] = []
    cur_active = conn_active.cursor()
    cur_active.execute("SELECT * FROM ODDS_BUNDLE WHERE REVENUE > 0.8;")
    raw_bundles = [raw_bundle for raw_bundle in cur_active.fetchall()]
    for raw_bundle in raw_bundles:
        bundle = Bundle.from_row(conn_active, raw_bundle)
        if bundle.start > time_now:
            update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))
    conn_active.close()

    #update
    update(update_keys)
    print("Live update completed")


def full_update():
    print("Running full update...")

    old_bundles = api.query.get_bundles()
    TheOddsAPI.sports.update_active_sports()
    new_bundles = TheOddsAPI.odds.get_all_bundles()

    conn_active = sqlite3.connect("active.db")
    conn_archive = sqlite3.connect("historical.db")

    for old_bundle in old_bundles:
        updated = False
        for new_bundle in new_bundles:
            if old_bundle == new_bundle:
                updated = True
        if not updated:
            old_bundle.archive(conn_active, conn_archive)

    for bundle in new_bundles:
        bundle.register(conn_active, conn_archive)

    conn_active.commit()
    conn_archive.commit()
    conn_active.close()
    conn_archive.close()

    print("Full update completed")
