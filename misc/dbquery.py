import sqlite3
import os
from typing import List

conn = sqlite3.connect("../active.db")

cur = conn.cursor()
cur.execute("SELECT * FROM ODDS;")

print(cur.fetchall())
