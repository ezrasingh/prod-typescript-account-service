FROM node:12.16.2-alpine AS Builder

WORKDIR /usr/src/app

COPY scripts/ ./
COPY dist/ ./
COPY package*.json ./

ENV PORT=80
ENV NODE_ENV=production
RUN npm ci

FROM Builder AS SecureRunner

# set permission on application runtime
# the node user is the only user who can
# exectute the runtime, all other access is denied
RUN chown node healthcheck.js
RUN chmod 500 healthcheck.js
RUN chown node app.bundle.js
RUN chmod 500 app.bundle.js

FROM SecureRunner AS Runner

RUN npm install pm2 -g --quiet

USER node

EXPOSE 80

HEALTHCHECK --interval=12s --timeout=12s --start-period=30s \
 CMD node healthcheck.js

CMD [ "pm2-runtime", "-i", "max", "app.bundle.js", "start" ]
