import sqlite3
import os
import api

def setup():
    create_bundles = """
    CREATE TABLE ODDS_BUNDLE
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
    CREATE TABLE ODDS
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

    lr = 0
    for db_name in ['./active.db', './historical.db']:
        conn = sqlite3.connect(db_name)
        cur = conn.cursor()
        cur.execute(create_bundles)
        cur.execute(create_odds)
        lr = cur.lastrowid
        conn.commit()
        conn.close()


    api.full_update()
    return str(lr)
