FROM postgres:11-alpine

COPY setup-replication.sh /docker-entrypoint-initdb.d/setup-replication.sh

RUN chmod 0666 /docker-entrypoint-initdb.d/setup-replication.sh


