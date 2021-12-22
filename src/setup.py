import sqlite3
import os
import api

def setup():
    create_bundles = """
    CREATE TABLE IF NOT EXISTS ODDS_BUNDLE
         (
         NAME           TEXT      NOT NULL,
         DESCRIPTION    TEXT      NOT NULL,
         API_QUERY      TEXT      NOT NULL,
         GAME           TEXT      NOT NULL,
         START          TEXT      NOT NULL,
         EVENTS         TEXT      NOT NULL,
         MARKETS        INT       NOT NULL,
         REVENUE        FLOAT     NOT NULL
         );
    """
    create_odds = """
    CREATE TABLE IF NOT EXISTS ODDS
        (
         BOOKMAKER  TEXT                  NOT NULL,
         REGION     TEXT                  NOT NULL,
         ODDS       TEXT                  NOT NULL,
         START      TEXT                  NOT NULL,
         LASTUPDATE TEXT                  NOT NULL,
         PREV_ENTRY INT,
         NXT        INT
        );
    """

    
    if os.path.exists('./active.db'):
        return

    for db_name in ['./active.db', './historical.db']:
        conn = sqlite3.connect(db_name)
        cur = conn.cursor()
        cur.execute(create_bundles)
        cur.execute(create_odds)
        conn.commit()
        conn.close()

    api.full_update()
