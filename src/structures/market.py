from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union, cast
from typing_extensions import Self

from flask import json


#                       ROWID BOOKMAKER REGION ODDS START LASTUPDATE PREV_ENTRY NXT
OddsRowFormat   = Tuple[int,  str,      str,   str, str,  str,       int,       int]


class Bookmaker:
    def __init__(self, name : str, region : str):
        self.name = name
        self.region = region

    def copy(self):
        return type(self)(self.name, self.region)

    def __eq__(self, other : Optional[Self]):
        if other == None:
            return False
        else:
            return self.name == other.name
    
    def __hash__(self):
        return hash((self.name, self.region))

class Odds:
    def __init__(self, outcome: str, odds : float, last_update : datetime):
        self.outcome = outcome
        self.odds = odds
        self.last_update = last_update

    
    def copy(self):
        return type(self)(self.outcome, self.odds, self.last_update)

    def __eq__(self, other):
        if other == None:
            return False
        else:
            cond1 = self.outcome == other.outcome
            cond2 = self.odds == other.odds
            cond3 = self.last_update == other.last_update
            return cond1 and cond2 and cond3

    def toDict(self):
        return {
            'outcome': self.outcome,
            'last_update': self.last_update.isoformat(),
            'odds': self.odds
        }

Outcome = str

class Market:
    def __init__(
                self,
                bookmaker   : Bookmaker,
                outcomes    : List[Outcome],
                odds        : Dict[Outcome, Odds],
                active      : bool = False,
                history     : List[Odds] = []
            ):

        self.bookmaker      = bookmaker
        self.outcomes       = outcomes
        self.odds           = odds
        self.active         = active
        self.history        = history
        self.outcomes.sort()
        self.lastupdate  = odds[list(odds.keys())[0]].last_update
    
    def compress_history(self):
        iter_odds : Dict[Outcome, Odds] = {}
        new_history : List[Odds] = []
        for odds in self.history:
            prev = iter_odds.get(odds.outcome, None)
            if prev == None:
                new_history.append(odds)
                iter_odds[odds.outcome] = odds
            else:
                if odds.odds != prev.odds or odds.last_update - prev.last_update > timedelta(hours=2):
                    new_history.append(odds)
                iter_odds[odds.outcome] = odds

    def copy(self):
        history = list(map(lambda x : x.copy(), self.history))
        odds = {key : self.odds[key].copy() for key in self.odds}
        return type(self)(self.bookmaker, self.outcomes.copy(), odds, self.active, history)

    def __eq__(self, other : Optional[Self]):
        if other == None:
            return False
        else:
            cond1 = self.bookmaker == other.bookmaker
            cond2 = self.outcomes == other.outcomes
            cond3 = self.odds == other.odds
            cond4 = self.history == other.history
            return cond1 and cond2 and cond3

