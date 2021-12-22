from datetime import datetime
from typing import List

from structures.event import Event

class OddsData:
    def __init__(
                self,
                bookmaker  : str,
                region     : str,
                start      : datetime,
                lastupdate : datetime,
                name       : str,
                events     : List[Event],
                game       : str):

        self.bookmaker  = bookmaker
        self.region     = region
        self.start      = start
        self.lastupdate = lastupdate
        self.name       = name
        self.events     = events
        self.game       = game
