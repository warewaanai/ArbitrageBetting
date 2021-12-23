import json
import flask
from typing import List, Set
from datetime import datetime

import TheOddsAPI.odds
import TheOddsAPI.sports
from structures import Bundle

import api.query


def update_active_sports():
    TheOddsAPI.sports.update_active_sports()


def update(
        active : Set[Bundle],
        conn_archive,
        keys : List[str],
        regions : List[str] = ['eu'],
        ):

    new_bundles = []

    events = json.loads(open('active_sports.json', "r").read())["data"]
    for region in regions:
        for event in events:
            if event["key"] in keys:
                new_bundles+= TheOddsAPI.odds.get_odds(event["group"], region, event["key"], f'{event["title"]} ({event["description"]})')
    
    for bundle in new_bundles:
        bundle.register(active, conn_archive)

    conn_archive.commit()
    conn_archive.close()

def update_best(
        active : Set[Bundle],
        conn_archive
    ):
    print("Running bestarb update...")
    
    update_keys : List[str] = []
    bundles = [bundle for bundle in active if bundle.revenue > 0.8]
    for bundle in bundles:
        update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))

    update(active, conn_archive, update_keys)
    print("Bestarbs update completed")


def update_live(
        active : Set[Bundle],
        conn_archive
    ):
    print("Running live update...")

    # fetch the update keys you need
    time_now = datetime.now()
    update_keys : List[str] = []
    bundles = [bundle for bundle in active if bundle.revenue > 0.8]
    for bundle in bundles:
        if bundle.start > time_now:
            update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))

    #update
    update(active, conn_archive, update_keys)
    print("Live update completed")


def full_update(
        active : Set[Bundle],
        conn_archive
    ):
    
    print("Running full update...")

    old_bundles = api.query.get_bundles(active)
    TheOddsAPI.sports.update_active_sports()
    new_bundles = TheOddsAPI.odds.get_all_bundles()

    for old_bundle in old_bundles:
        updated = False
        for new_bundle in new_bundles:
            if old_bundle == new_bundle:
                updated = True
        if not updated:
            old_bundle.archive(active, conn_archive)

    for bundle in new_bundles:
        bundle.register(active, conn_archive)

    conn_archive.commit()
    conn_archive.close()

    print("Full update completed")
