#!/bin/bash
if [ ! -s "$PGDATA/PG_VERSION" ]; then
echo "*:*:*:$PG_REP_USER:$PG_REP_PASSWORD" > ~/.pgpass

chmod 0600 ~/.pgpass

# ? sanity check for pg master availability
until ping -c 1 -W 1 ${PG_MASTER_HOST:?missing environment variable. PG_MASTER_HOST must be set}
  do
    echo "Waiting for master to ping..."
    sleep 1s
done

# ? synchronize pg master data with pg pool
until pg_basebackup -h ${PG_MASTER_HOST} -D ${PGDATA} -U ${PG_POOL_USER} --wal-method=fetch
  do
    echo "Waiting for master to connect..."
    sleep 1s
done

# ? set pool connection options in pg_hba.conf
echo "host replication all 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"

set -e

# ? set recovery options
cat > ${PGDATA}/recovery.conf <<EOF
standby_mode = on
primary_conninfo = 'host=$PG_MASTER_HOST port=${PG_MASTER_PORT:-5432} user=$PG_POOL_USER password=$PG_POOL_PASSWORD'
trigger_file = '/tmp/masterNow'
EOF

chown postgres. ${PGDATA} -R
chmod 700 ${PGDATA} -R
fi

# ? configure replication node
cat >> ${PGDATA}/postgresql.conf <<EOF
wal_level = replica
# archive_mode = on
# archive_command = 'cd .'
max_wal_senders = 8
wal_keep_segments = 8
hot_standby = on
EOF

exec "$@"
