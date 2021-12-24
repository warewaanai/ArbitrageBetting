import api
from typing import Set
from timeloop import Timeloop
from datetime import timedelta
from structures.bundle import Bundle

def start_update_loop(active : Set[Bundle], archive):
    print("Started update loop")
    tl = Timeloop()

    @tl.job(interval=timedelta(minutes=15))
    def full_update():
        api.full_update(active, archive)

    """        
        @tl.job(interval=timedelta(seconds=60))
        def live_update():
            api.update_live(active)

        @tl.job(interval=timedelta(minutes=5))
        def best_update():
            api.update_best(active)
    """

    tl.start()
    return tl
