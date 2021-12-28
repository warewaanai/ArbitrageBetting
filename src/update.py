import api
from threading import Thread
from timeloop import Timeloop
from datetime import timedelta
from structures import ActiveBundles

def start_update_loop(active : ActiveBundles):
    print("Started update loop")
    tl = Timeloop()

    @tl.job(interval=timedelta(minutes=15))
    def full_update():
        api.full_update(active)

    @tl.job(interval=timedelta(seconds=20))
    def live_update():
        api.update_live(active)

    @tl.job(interval=timedelta(minutes=5))
    def best_update():
        api.update_best(active)

    tl.start()
    return tl
