#!/bin/bash
if [ ! -s "$PGDATA/PG_VERSION" ]; then
echo "*:*:*:$PG_POOL_USER:$PG_POOL_PASSWORD" > ~/.pgpass

chmod 0600 ~/.pgpass

# ? sanity check for pg master availability
until ping -c 1 -W 1 ${PG_MASTER_HOST:?missing environment variable. PG_MASTER_HOST must be set}
  do
    echo "Waiting for master to ping..."
    sleep 1s
done

mkdir -p ${PG_DATA}/backups/archive

# ? synchronize pg master data with pg pool
until pg_basebackup -h ${PG_MASTER_HOST} -D ${PGDATA} -U ${PG_POOL_USER} --wal-method=stream --no-password
  do
    echo "Waiting for master to connect..."
    sleep 1s
done

set -e

chown postgres ${PGDATA} -R
chmod 700 ${PGDATA} -R
fi

# ? configure replication node
cat >> ${PGDATA}/postgresql.conf <<EOF
port = 5432
hot_standby = on
EOF

# ? set recovery options
cat > ${PGDATA}/recovery.conf <<EOF
standby_mode = on
primary_conninfo = 'host=$PG_MASTER_HOST user=$PG_POOL_USER password=$PG_POOL_PASSWORD'
archive_cleanup_command = 'pg_archivecleanup $PG_DATA/backups/archive %r'
EOF

exec "$@"
