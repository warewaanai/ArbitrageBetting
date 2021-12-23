import os
import mysql.connector
from typing import Optional
from threading import Thread
from urllib.parse import urlparse

def getArchive():
    ACTIVE_DB = os.environ.get('ARCHIVE_DB')
    res = urlparse(ACTIVE_DB)
    return mysql.connector.connect(        
        host=res.hostname,
        user=res.username,
        password=res.password,
        database=res.path[1:]
    )
