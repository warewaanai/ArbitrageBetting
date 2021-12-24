import json
from multiprocessing.pool import AsyncResult
from threading import Thread
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime

import TheOddsAPI.odds
import TheOddsAPI.sports
from structures import Bundle

import api.query
from structures import bundled_odds
from structures.bundled_odds import BundledOdds


active_events = {}
toarchive_bundles : List[Bundle] = []

def update_active_sports():
    TheOddsAPI.sports.update_active_sports()


def archive(archive_conn):
    global toarchive_bundles

    archive_list : List[Bundle] = toarchive_bundles.copy()
    toarchive_bundles = []
    archive_dict : Dict[Bundle, List[Bundle]] = dict()

    for bundle in archive_list:
        if bundle in archive_dict.keys():
            archive_dict[bundle].append(bundle)
        else:
            archive_dict[bundle] = [bundle]

    for bundle in archive_dict.keys():
        bundle_list = archive_dict[bundle]

        # see if an old version of the bundle exists in the historical db
        archive_cur = archive_conn.cursor()
        archive_cur.execute(
            "SELECT * FROM ODDS_BUNDLE WHERE NAME=%s AND DESCRIPTION=%s AND START=%s;",
            (bundle.name, bundle.description, bundle.start)
        )
        old_historical_rows = archive_cur.fetchall()
        archive_cur.close()
        assert(len(old_historical_rows) <= 1)

        market_dict : Dict[Tuple[str, str], BundledOdds] = {}

        
        # if yes, use it to initialize market_dict
        if len(old_historical_rows) == 1:
            old_historical_bundle = Bundle.from_row(archive_conn, old_historical_rows[0])
            old_historical_bundle.unregister(archive_conn)
            for market in old_historical_bundle.markets:
                market_dict[(market.region, market.bookmaker)] = market

        for bundle in bundle_list:
            next_id = -1
            for market in bundle.markets:
                if not (market.region, market.bookmaker) in market_dict.keys():
                    market_dict[(market.region, market.bookmaker)] = market
                else:
                    prev_entry = market_dict[(market.region, market.bookmaker)]
                    market.preventry = prev_entry.rowid
                    market_dict[(market.region, market.bookmaker)] = market
                next_id = market.register_db(archive_conn, next_id)


        #register the new historical bundle
        bundle_list[-1].register_db(archive_conn)

    archive_conn.commit()


def update(
        active : Set[Bundle],
        keys : List[str],
        regions : List[str] = ['uk']
        ):

    global active_updates, active_events

    new_bundles : List[Bundle] = []
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
        bundle.register(active)
        toarchive_bundles.append(bundle)

    return new_bundles

def update_best(active : Set[Bundle]):

    print("Running bestarb update...")
    
    update_keys : List[str] = []
    bundles = [bundle for bundle in active if bundle.revenue > 0.8]
    for bundle in bundles:
        update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))


    update(active, update_keys)

    print("Bestarbs update completed")


def update_live(active : Set[Bundle]):
    print("Running live update...")

    time_now = datetime.utcnow()
    update_keys : List[str] = []
    bundles = [bundle for bundle in active if bundle.revenue > 0.8]
    for bundle in bundles:
        if bundle.start > time_now:
            update_keys.append(bundle.api_query)
    update_keys = list(dict.fromkeys(update_keys))

    update(active, update_keys)
    

    print("Live update completed")


def full_update(active : Set[Bundle], archive_conn = None):
    print("Running full update...")

    global active_updates, active_events

    TheOddsAPI.sports.update_active_sports()
    
    with open('active_sports.json', "r") as fi:
        active_events = json.loads(fi.read())['data']
        fi.close()

    update_keys : List[str] = []
    for event in active_events:
        update_keys.append(event['key'])
    update_keys = list(dict.fromkeys(update_keys))

    old_bundles : List[Bundle] = list(active).copy()
    new_bundles : List[Bundle] = update(active, update_keys)


    for old_bundle in old_bundles:
        if not old_bundle in new_bundles:
            toarchive_bundles.append(old_bundle)

    if archive_conn != None:
        print("Archiving...")
        Thread(target=archive, args=(archive_conn,)).start()

    print("Full update completed")
