import sqlite3
import os
from typing import List

"""
    This deletes the database and executes the commands in the 'table creation' sqlite file.
    I didn't get to configure sqlite on my machine and this seemed straight forward, don't judge.
"""

commands : List[str] = []
with open("table creation.sqlite", "r") as fi:
    lines = fi.readlines()
    
    newCmd = True
    for line in lines:
        if line == "\n":
            newCmd = True
        elif newCmd == False:
            commands[-1]+= line
        elif newCmd == True:
            commands.append(line)

        if line != "\n":
            newCmd = False



for db_name in ['active', 'historical']:
    db_path = f'../{db_name}.db'
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    for cmd in commands:
        conn.execute(cmd)
    conn.close()
