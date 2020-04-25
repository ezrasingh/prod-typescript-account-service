FROM postgres:9.6-alpine

COPY setup-standby.sh /docker-entrypoint-initdb.d/

RUN chmod +x /docker-entrypoint-initdb.d/setup-standby.sh

EXPOSE 5432