from typing import List, Set

from structures import Bundle


def get_bundles(active : Set[Bundle]):
    return [bundle for bundle in active.copy() if bundle.revenue > 0]
