CREATE TABLE EVENTS (
    ID              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    UKEY            VARCHAR(256)    NOT NULL UNIQUE,
    NAME            TEXT            NOT NULL,
    START           BIGINT          NOT NULL,
    DESCRIPTION     TEXT            NOT NULL,
    API_QUERY       TEXT            NOT NULL,
    OUTCOMES        TEXT            NOT NULL
);

CREATE TABLE ODDS (
        ID              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
        BOOKMAKER       TEXT            NOT NULL,
        REGION          TEXT            NOT NULL,
        ODDS            DOUBLE          NOT NULL,
        LAST_UPDATE     BIGINT          NOT NULL,
        PARENT_EVENT    VARCHAR(256)    NOT NULL
);
