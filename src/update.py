import api
import time
from datetime import date, datetime, timedelta
from threading import Thread
from structures import ActiveBundles

def start_update_loop(active : ActiveBundles):
    def loop():
        print("Started update loop")
        last_full   = datetime.utcnow()
        last_best   = datetime.utcnow()
        last_active = datetime.utcnow()

        while True:
            time_now = datetime.utcnow()

            if time_now - last_full > timedelta(minutes=20):
                api.full_update(active)
                last_full = datetime.utcnow()
            elif time_now - last_best > timedelta(minutes=5):
                api.update_best(active)
                last_best = datetime.utcnow()
            elif time_now - last_active > timedelta(seconds=20):
                api.update_live(active)
                last_active  = datetime.utcnow()
            time.sleep(1)


    if active.updating == False:
        active.updating = True
        loopthread = Thread(target=loop)
        loopthread.start()
        return loopthread
    else:
        return None