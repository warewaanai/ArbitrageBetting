from datetime import datetime
from sqlite3.dbapi2 import Connection
from typing import List, Tuple

from structures.odds_data import OddsData


#                       ROWID BOOKMAKER REGION ODDS START LASTUPDATE PREV_ENTRY NXT
OddsRowFormat   = Tuple[int,  str,      str,   str, str,  str,       int,       int]

class BundledOddsRegistration:
    def __init__(self, rowid : int, row : OddsRowFormat):
        self.rowid = rowid
        self.row = row


class BundledOdds:
    def __init__(
                self,
                bookmaker  : str,
                region     : str,
                odds       : List[float],
                start      : datetime,
                lastupdate : datetime,
                rowid      : int = -1,
                preventry  : int = -1
            ):

        self.bookmaker  = bookmaker
        self.region     = region
        self.odds       = odds
        self.start      = start
        self.lastupdate = lastupdate
        self.preventry  = preventry
        self.rowid      = rowid


    @staticmethod
    def from_data(data : OddsData):
        return BundledOdds(data.bookmaker, data.region, [evt.odds for evt in data.events], data.start, data.lastupdate)


    @staticmethod
    def from_row(row : OddsRowFormat):
        rowid      = row[0]
        bookmaker  = row[1]
        region     = row[2]
        odds       = list(map(float, row[3].split('&&')))
        start      = datetime.fromisoformat(row[4])
        lastupdate = datetime.fromisoformat(row[5])
        preventry  = row[6]

        return BundledOdds(bookmaker, region, odds, start, lastupdate, rowid, preventry)


    def register_raw(self, conn : Connection, next : int = -1) -> int:
        cur = conn.cursor()
        res = cur.execute(
            'INSERT INTO ODDS VALUES (?, ?, ?, ?, ?, ?, ?);',
            (self.bookmaker, self.region, '&&'.join(map(str, self.odds)), self.start.isoformat(), self.lastupdate.isoformat(), self.preventry, next)
        )
        self.rowid = res.lastrowid

        return self.rowid


    def unregister(self, conn : Connection, next : int = -1):
        cur = conn.cursor()
        cur.execute(
            'DELETE FROM ODDS WHERE ROWID=?;',
            [self.rowid]
        )
