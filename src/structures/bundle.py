from datetime import datetime
from typing import List, Set, Tuple
from typing_extensions import Self

from structures.bundled_odds import BundledOdds


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
    def from_row(conn, row : BundleRowFormat):
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
                'SELECT * FROM ODDS WHERE ID=%s;',
                [market_ptr]
            )
            res = cur.fetchall()
            cur.nextset()
            cur.close()
            assert(len(res) == 1)

            new_market = BundledOdds.from_row(res[0])
            new_market.rowid = market_ptr

            markets.append(new_market)
            market_ptr = res[0][7]

        return Bundle(name, description, api_query, start, events, game, markets, rowid)

    def unregister(self, conn):
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM ODDS_BUNDLE WHERE ID=%s;",
            [self.rowid]
        )
        cur.nextset()
        cur.close()

    def register_db(self, conn) -> int:
        markets_ptr = -1
        for market in self.markets:
            market.rowid = market.register_db(conn, markets_ptr)
            markets_ptr = market.rowid

        cur = conn.cursor()
        res = cur.execute(
            'INSERT INTO ODDS_BUNDLE (NAME, DESCRIPTION, API_QUERY, GAME, START, EVENTS, MARKETS, REVENUE) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);',
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
        self.rowid = cur.lastrowid
        cur.nextset()
        cur.close()
        return self.rowid


    def register(self, active : Set[Self]):
        old_active = [bundle for bundle in active.copy() if bundle == self]
        assert(len(old_active) <= 1)
        if len(old_active) == 1: # if yes, archive it
            active.discard(old_active[0])
        active.add(self)


    def __eq__(self, other : Self):
        cond1 = self.name == other.name
        cond2 = self.api_query == other.api_query
        cond3 = self.start == other.start

        return cond1 and cond2 and cond3

    def __hash__(self) -> int:
        return hash((self.name, self.api_query, self.start.isoformat()))



def arbitrage(markets : List[BundledOdds]) -> float:
    n, m = len(markets), len(markets[0].odds)
    best_odds = markets[0].odds
    for market in markets:
        best_odds = [max(current, new) for (current, new) in zip(best_odds, market.odds)]

    return (1 / sum([1 / odds for odds in best_odds]))
