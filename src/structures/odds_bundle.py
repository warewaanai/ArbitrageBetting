import json
from simple_websocket import Server
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple, cast
from typing_extensions import Self
from structures import market

from structures.market import Bookmaker, Market, Odds, Outcome

# 0.ID 1.UKEY 2.NAME 3.START 4.DESCRIPTION 5.API_QUERY 6.SPORT_NAME, 7.OUTCOMES
BundleRowFormat = Tuple[int, str, str, str, str, str, str, str]



class OddsBundle:
    def __init__(
            self,
            name                : str,
            description         : str,
            api_query           : str,
            start               : datetime,
            outcomes            : List[Outcome],
            sport               : str,
            markets             : Dict[Bookmaker, Market],
        ): #list of odds

        self.name        = name
        self.description = description
        self.api_query   = api_query
        self.start       = start
        self.outcomes    = outcomes
        self.sport       = sport
        self.markets     = markets
        self.max_revenue = 0
        self.id = 0

        if datetime.utcnow() > self.start:
            for bookmaker in self.markets:
                if datetime.utcnow() - self.markets[bookmaker].lastupdate > timedelta(minutes=4):
                    self.markets[bookmaker].active = False

    @staticmethod
    def from_row(row : BundleRowFormat):
        return OddsBundle(row[2], row[4], row[5], datetime.fromisoformat(row[3]), row[7].split('&&&'), row[6], {})

    def copy(self):
        markets = {bookmaker : self.markets[bookmaker].copy() for bookmaker in self.markets.keys()}
        res = type(self)(self.name, self.description, self.api_query, self.start, self.outcomes.copy(), self.sport, markets)
        res.max_revenue = self.max_revenue
        return res

    def compress_history(self):
        for bookmaker in self.markets.keys():
            self.markets[bookmaker].compress_history()

    def append_old(self, old : Self):
        for bookmaker in old.markets.keys():
            my_market = self.markets.get(bookmaker, None)
            old_market = old.markets[bookmaker]
            if my_market == None:
                self.markets[bookmaker] = old_market
                self.markets[bookmaker].active = False
            else:
                new_history : List[Odds] = my_market.history + old_market.history
                for outcome in old_market.outcomes:
                    new_history.append(cast(Odds, old_market.odds[outcome]))

                new_history.sort(key = (lambda odds : odds.last_update))
                new_history = [a for (a, b) in zip(new_history, new_history[1:] + [cast(Odds, None)]) if a != b]
                self.markets[bookmaker].history = new_history
        self.max_revenue = max(self.arbitrage(), old.max_revenue)


    def toJSON(self) -> str:
        markets : List = []
        
        if datetime.utcnow() > self.start:
            for bookmaker in self.markets:
                if datetime.utcnow() - self.markets[bookmaker].lastupdate > timedelta(minutes=4):
                    self.markets[bookmaker].active = False
        
        for bookmaker in self.markets.keys():
            market = self.markets[bookmaker]

            odds_dict = {}
            for outcome in market.odds.keys():
                odds_dict[outcome] = market.odds[outcome].toDict()


            market_history = []
            if self.start < datetime.utcnow() or not market.active:
                market_history = [odds.toDict() for odds in self.markets[bookmaker].history]
            else:
                market_history = [odds.toDict() for odds in self.markets[bookmaker].history if odds.last_update > self.start]

            markets.append({
                'bookmaker': bookmaker.name,
                'active': market.active,
                'odds' : odds_dict,
                'outcomes' : self.outcomes,
                'region': bookmaker.region,
                'last_update': market.lastupdate.isoformat(),
                'history': market_history
            })

        return json.dumps({
            'id': f'"{self.id}"',
            'name': self.name,
            'sport': self.sport,
            'description': self.description,
            'revenue': self.arbitrage(),
            'max_revenue': self.max_revenue,
            'outcomes': self.outcomes,
            'start_time': self.start.isoformat(),
            'live': (self.start <= datetime.utcnow()),
            'markets': markets
        })

    def arbitrage(self) -> float:
        if len(self.markets) == 0 or len(self.outcomes) == 0:
            return 0.0

        if datetime.utcnow() > self.start:
            for bookmaker in self.markets:
                if datetime.utcnow() - self.markets[bookmaker].lastupdate > timedelta(minutes=4):
                    self.markets[bookmaker].active = False

        something = False
        best_odds : Dict[Outcome, float] = {}
        for bookmaker in self.markets.keys():
            market = self.markets[bookmaker]
            if market.active:
                something = True
                for outcome in self.outcomes:
                    best_odds[outcome] = max(best_odds.get(outcome, 0.0), market.odds[outcome].odds)

        if something:
            ha = 0.0
            for outcome in self.outcomes:
                ha+= 1 / best_odds[outcome]
            ha = 1 / ha
            return ha - 1
        else:
            return 0


    def __eq__(self, other : Self):
        if other == None:
            return False

        cond1 = self.name == other.name
        cond2 = self.api_query == other.api_query
        cond3 = self.start == other.start

        return cond1 and cond2 and cond3

    def __hash__(self) -> int:
        return hash((self.name, self.api_query, self.start.isoformat()))


class ActiveBundles:
    def __init__(self):
        self.active_set : Set[OddsBundle] = set()
        self.archive_set : Set[OddsBundle] = set()
        self.fromId : Dict[int, OddsBundle] = {}
        

    def add(self, bundle : OddsBundle):
        if bundle in self.active_set:
            old_active = [abundle for abundle in self.active_set.copy() if abundle == bundle][0]
            id = old_active.id
            bundle.id = id
            bundle.append_old(old_active)
            self.active_set.discard(old_active)
            self.active_set.add(bundle)
            self.fromId[id] = bundle
        else:
            self.active_set.add(bundle)
            id = hash(bundle)
            while self.fromId.get(id, None) != None:
                id+= 1
            self.fromId[id] = bundle
            bundle.id = id

        if bundle in self.archive_set:
            bc = bundle.copy()
            old_archive = [abundle for abundle in self.archive_set.copy() if abundle == bundle][0]
            bc.id = old_archive.id
            self.archive_set.discard(old_archive)
            self.archive_set.add(bc)
            

        if bundle.start < datetime.utcnow():
            print(f'Liveid: ({bundle.id})');


    def discard(self, bundle : OddsBundle):
        if bundle in self.active_set:
            old_active = [abundle for abundle in self.active_set.copy() if abundle == bundle][0]
            id = old_active.id
            self.fromId.pop(id)
            self.active_set.discard(old_active)
            bundle.id = -1
    
    def add_archive(self, bundle : OddsBundle):
        if len(self.archive_set) > 1200:
            return

        if bundle in self.archive_set:
            old_archive = [abundle for abundle in self.archive_set.copy() if abundle == bundle][0]
            self.archive_set.discard(old_archive)
            bundle.append_old(old_archive)
            bundle.id = old_archive.id
            self.archive_set.add(bundle)
        else:
            self.archive_set.add(bundle)
            id = hash(bundle)
            while self.fromId.get(id, None) != None:
                id+= 1
            self.fromId[id] = bundle
            bundle.id = id

    def drop_archive(self):
        for bundle in self.archive_set:
            self.fromId.pop(bundle.id)
        self.archive_set = set()

    def active_list(self):
        return [bundle for bundle in self.active_set]

    def size(self) -> Tuple[int, int]:
        return (len(self.active_set), len(self.archive_set))
