import sqlite3
from typing import List

from structures import Bundle

def get_bundles():
    conn = sqlite3.connect("active.db")
    cur = conn.cursor()

    bundles : List[Bundle] = []
    cur.execute("SELECT rowid, * FROM ODDS_BUNDLE WHERE REVENUE > 0;")
    bundle_rows = cur.fetchall()
    for raw_bundle in [raw_bundle for raw_bundle in bundle_rows]:
        bundles.append(Bundle.from_row(conn, raw_bundle))

    
    conn.close()
    return bundles
