from datetime import date, datetime
import time
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import simple_websocket
import os

from structures import ActiveBundles
from update import start_update_loop
import api

# setup
load_dotenv()

PORT = int(os.environ.get("PORT", 5000))
app = Flask(__name__, static_url_path='', static_folder='../frontend_build')
CORS(app)

active : ActiveBundles = ActiveBundles()


@app.route('/api/cleanup')
def cleanup():
    active.drop_archive()
    return "oki :<"
    

@app.route('/api/get_stats')
def get_stats():
    return jsonify(api.get_stats(active))


@app.route('/api/get_arbs')
def get_arbs():
    return jsonify([bundle.toJSON() for bundle in active.active_set if bundle.arbitrage() >= 0.005])

@app.route('/api/get_bundle/<id>')
def get_bundle(id):
    try:
        id = int(id)
    except:
        return "{}", 400
    bundle = active.fromId.get(id, None)
    if bundle == None:
        return "{}", 400
    else:
        return bundle.toJSON()

@app.route('/api/get_socket/<id>', websocket=True)
def get_socket(id):
    try:
        id = int(id)
    except:
        return "{}", 400

    ws = simple_websocket.Server(request.environ, max_message_size=0) # is the max_message size blocking sends?
    try:
        while True:
            bundle = active.fromId.get(id, None)
            if bundle == None:
               break
            if bundle.start < datetime.utcnow():
                break
            ws.send(bundle.toJSON())
            time.sleep(10)
    except:
        pass
    return 'Connection ended'


@app.route("/", defaults={'path':''})
def serve_index(path):
    return send_from_directory(str(app.static_folder), 'index.html')

@app.route("/statistics/", defaults={'path':''})
def serve_stats(path):
    return send_from_directory(str(app.static_folder), 'index.html')

@app.route("/event/<id>", defaults={'path':''})
def serve_event():
    return send_from_directory(str(app.static_folder), 'index.html')


if __name__ == '__main__':
    api.full_update(active)
    tl = start_update_loop(active)
    app.run(port=PORT, host="0.0.0.0", debug=False)
    tl.stop()
