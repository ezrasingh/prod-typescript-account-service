#!/bin/bash

# ? configure master node
cat >> ${PGDATA}/postgresql.conf <<EOF
wal_level = replica           # 9.6+ onwards
archive_mode = on
archive_command = 'rsync -av %p $PG_DATA/backups/archive/%f' # shared location somewhere
archive_timeout = 30 # Forced WAL switch after 30 sec.
wal_max_Senders = 2 # concurrent connections from standby
wal_keep_segments = 30 # Keeping last 30 WAL's
log_connections = on # info. regarding connections or failures.
EOF

# ? configure pg_hba
cat > ${PGDATA}/pg_hba.conf <<EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
# "local" is for Unix domain socket connections only
local   all             all                                     trust
local   replication      $PG_POOL_USER  all          md5
EOF

# ? create replication pool user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
CREATE USER $PG_POOL_USER REPLICATION LOGIN CONNECTION LIMIT 100 ENCRYPTED PASSWORD '$PG_POOL_PASSWORD';
EOSQL
