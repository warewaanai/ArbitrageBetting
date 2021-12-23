import os
import mysql.connector
from urllib.parse import urlparse

def getActive():
    ACTIVE_DB = os.environ.get('ACTIVE_DB')
    res = urlparse(ACTIVE_DB)
    return mysql.connector.connect(        
        host=res.hostname,
        user=res.username,
        password=res.password,
        database=res.path[1:]
    )

def getArchive():
    ACTIVE_DB = os.environ.get('ARCHIVE_DB')
    res = urlparse(ACTIVE_DB)
    return mysql.connector.connect(        
        host=res.hostname,
        user=res.username,
        password=res.password,
        database=res.path[1:]
    )