from sqlite3.dbapi2 import Connection
from datetime import datetime
from typing import List, Tuple
from typing_extensions import Self

from structures.bundled_odds import BundledOdds
from structures.odds_data import OddsData


#                       ROWID, NAME API_QUERY DESCRIPTION GAME START EVENTS MARKETS REVENUE
BundleRowFormat = Tuple[int,   str, str,      str,        str, str,  str,   int,    float]


class Bundle:
    def __init__(
            self,
            name                : str,
            description         : str,
            api_query           : str,
            start               : datetime,
            events              : List[str],
            game                : str,
            markets             : List[BundledOdds],
            rowid               : int = -1
        ): #list of odds

        self.name        = name
        self.description = description
        self.api_query   = api_query
        self.start       = start
        self.events      = events
        self.game        = game
        self.markets     = markets
        self.revenue     = 0 if markets == [] else arbitrage(markets)
        self.rowid       = rowid

    @staticmethod
    def from_row(conn : Connection, row : BundleRowFormat):
        rowid       = row[0]
        name        = row[1]
        description = row[2]
        api_query   = row[3]
        game        = row[4]
        start       = datetime.fromisoformat(row[5])
        events      = row[6].split('&&')
        market_ptr = int(row[7])

        markets = []
        while market_ptr != -1:
            cur = conn.cursor()
            cur.execute(
                'SELECT rowid, * FROM ODDS WHERE ROWID=?;',
                [market_ptr]
            )
            res = cur.fetchall()
            assert(len(res) == 1)

            new_market = BundledOdds.from_row(res[0])
            new_market.rowid = market_ptr

            markets.append(new_market)
            market_ptr = res[0][7]

        return Bundle(name, description, api_query, start, events, game, markets, rowid)

    def unregister(self, conn : Connection, unregister_markets = False):
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM ODDS_BUNDLE WHERE ROWID=?;",
            [self.rowid]
        )

        if unregister_markets:
            for market in self.markets:
                market.unregister(conn)


    def register_raw(self, conn : Connection) -> int:
        markets_ptr = -1
        for market in self.markets:
            market.rowid = market.register_raw(conn, markets_ptr)
            markets_ptr = market.rowid

        cur = conn.cursor()
        res = cur.execute(
            'INSERT INTO ODDS_BUNDLE VALUES (?, ?, ?, ?, ?, ?, ? ,?);',
            (
                self.name,
                self.description,
                self.api_query,
                self.game,
                self.start.isoformat(),
                '&&'.join(self.events),
                markets_ptr,
                self.revenue
            )
        )
        self.rowid = res.lastrowid
        return self.rowid


    def register(self, active_conn : Connection, archive_conn : Connection) -> int:
        # see if an old version of the bundle exists in the active db
        active_cur = active_conn.cursor()
        active_cur.execute(
            "SELECT rowid, * FROM ODDS_BUNDLE WHERE NAME=? AND DESCRIPTION=? AND START=?",
            (self.name, self.description, self.start.isoformat())
        )
        old_active = active_cur.fetchall()
        assert(len(old_active) <= 1)
        if len(old_active) == 1: # if yes, archive it
            old_active_bundle = Bundle.from_row(active_conn, old_active[0])
            old_active_bundle.archive(active_conn, archive_conn)

        # create the new active db bundle instance
        ret = self.register_raw(active_conn)
        
        active_conn.commit()
        archive_conn.commit()

        return ret


    def archive(self, active_conn : Connection, archive_conn : Connection):
        self.unregister(active_conn, unregister_markets=True)

        # see if an old version of the bundle exists in the historical db
        archive_cur = archive_conn.cursor()
        archive_cur.execute(
            "SELECT rowid, * FROM ODDS_BUNDLE WHERE NAME=? AND DESCRIPTION=? AND START=?;",
            (self.name, self.description, self.start)
        )
        old_historical_rows = archive_cur.fetchall()
        assert(len(old_historical_rows) <= 1)

        # if yes, record the old odds instances to "link them up" in the linked list representing the bet odds progression by storing the old odds pointers in new_historical_odds, then delete the historical db entry
        if len(old_historical_rows) == 1:
            old_historical_bundle = Bundle.from_row(archive_conn, old_historical_rows[0])
            old_historical_bundle.rowid = archive_cur.lastrowid
            old_historical_bundle.unregister(archive_conn, unregister_markets=False)

            new_historical_odds = {}

            for market in old_historical_bundle.markets:
                new_historical_odds[(market.bookmaker, market.region)] = market

            for market in self.markets:
                if new_historical_odds.get((market.bookmaker, market.region), None) == None:
                    new_historical_odds[(market.bookmaker, market.region)] = market
                else:
                    old_market = new_historical_odds[(market.bookmaker, market.region)]
                    market.preventry = old_market.rowid
                    new_historical_odds[(market.bookmaker, market.region)] = market
            self.markets = list(new_historical_odds.values())

        #register the new historical bundle
        self.register_raw(archive_conn)



    def append_odds(self, odds : OddsData):
        self.markets.append(BundledOdds.from_data(odds))
        self.revenue = arbitrage(self.markets)


    def __eq__(self, other : Self):
        cond1 = self.name == other.name
        cond2 = self.api_query == other.api_query
        cond3 = self.start == other.start

        return cond1 and cond2 and cond3





def arbitrage(markets : List[BundledOdds]) -> float:
    n, m = len(markets), len(markets[0].odds)
    best_odds = markets[0].odds
    for market in markets:
        best_odds = [max(current, new) for (current, new) in zip(best_odds, market.odds)]

    return (1 / sum([1 / odds for odds in best_odds]))