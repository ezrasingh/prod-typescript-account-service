FROM postgres:11-alpine

COPY docker-entrypoint.sh ./

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
