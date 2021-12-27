import json
from multiprocessing.pool import AsyncResult
from threading import Thread
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime

import TheOddsAPI.odds
import TheOddsAPI.sports
from structures import OddsBundle, Odds, ActiveBundles


active_events = {}

def update_active_sports():
    TheOddsAPI.sports.update_active_sports()


def archive(bundles):
    print("To be implemented... (when we actually need it)")


def update(
        active : ActiveBundles,
        keys : List[str],
        regions : List[str] = ['uk']
        ):

    global active_events
    keys = list(dict.fromkeys(keys))

    new_bundles : List[OddsBundle] = []
    thread_list : List[Thread] = []
    events = active_events
    for region in regions:
        for event in events:
            if event["key"] in keys:
                def targ(new_bundles, event):
                    for bundle in TheOddsAPI.odds.get_odds(event["group"], region, event["key"], f'{event["title"]} ({event["description"]})'):
                        new_bundles.append(bundle)
                thread_list.append(Thread(target=targ, args=(new_bundles,event)))
    
    for thread in thread_list:
        thread.start()
    for thread in thread_list:
        thread.join()                
    print("Registering...")

    for bundle in new_bundles:
        active.add(bundle)
        if bundle.arbitrage() > 0.2:
            active.add_archive(bundle.copy())

    return new_bundles

def update_best(active : ActiveBundles):
    print("Running bestarb update...")
    
    update_keys : List[str] = []
    bundles = [bundle for bundle in active.active_set if bundle.arbitrage() > 0.04]
    for bundle in bundles:
        update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))

    update(active, update_keys)

    print("Bestarbs update completed")


def update_live(active : ActiveBundles):
    print("Running live update...")

    time_now = datetime.utcnow()
    update_keys : List[str] = []
    bundles = [bundle for bundle in active.active_set]
    for bundle in bundles:
        if bundle.start > time_now:
            update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))

    update(active, update_keys)

    print("Live update completed")


def full_update(active : ActiveBundles, archive_conn = None):
    print("Running full update...")

    global active_updates, active_events

    TheOddsAPI.sports.update_active_sports()
    
    with open('active_sports.json', "r") as fi:
        active_events = json.loads(fi.read())['data']
        fi.close()

    update_keys : List[str] = []
    for event in active_events:
        update_keys.append(event['key'])

    old_bundles : List[OddsBundle] = active.active_list()
    new_bundles : List[OddsBundle] = update(active, update_keys)


    for old_bundle in old_bundles:
        if not old_bundle in new_bundles:
            active.discard(old_bundle)

    if archive_conn != None:
        Thread(target=archive, args=(archive_conn,)).start()

    print("Full update completed")

def get_stats(active : ActiveBundles):
    return [bundle.toJSON() for bundle in active.archive_set]
