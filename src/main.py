from dotenv import load_dotenv
from datetime import datetime
from typing import List
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from setup import setup

from structures.bundle import Bundle
import api

# setup
load_dotenv()
setup()

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


if __name__ == "__main__":
    app.run()