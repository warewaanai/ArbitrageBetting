from dotenv import load_dotenv
from datetime import datetime
from typing import List
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import sqlite3
import os

from structures.bundle import Bundle
import api

# setup
load_dotenv()

PORT = int(os.environ.get("PORT", 5000))

app = Flask(__name__, static_url_path='', static_folder='../frontend_build')

@app.route('/api/get_bundles')
def get_bundles():
    bundles : List[Bundle] = api.get_bundles()
    
    json_bundles = []
    for bundle in bundles:
        json_bundles.append({
            'name': bundle.name,
            'game': bundle.game,
            'description': bundle.description,
            'revenue': bundle.revenue - 1,
            'events': bundle.events,
            'start_time': bundle.start.isoformat(),
            'live': (bundle.start <= datetime.now()),
            'markets': [
                    {
                        'bookmaker': market.bookmaker,
                        'odds' : market.odds,
                        'region': market.region,
                        'last_update': market.lastupdate.isoformat()
                    }
                for market in bundle.markets]
        })

    return jsonify(json_bundles)


@app.route("/", defaults={'path':''})
def serve(path):
    return send_from_directory(str(app.static_folder), 'index.html')


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
        
        print(f'registered {db_name}')


    api.full_update()


if __name__ == "__main__":
    app.run(port=PORT, host="0.0.0.0", debug=False)
    setup()