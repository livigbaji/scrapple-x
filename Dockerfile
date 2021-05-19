FROM node:14-alpine3.10 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# release image

FROM node:14-alpine3.10 AS release

ENV CHROME_BIN="/usr/bin/chromium-browser"\
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN set -x \
    && apk update \
    && apk upgrade \
    # replacing default repositories with edge ones
    && echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" > /etc/apk/repositories \
    && echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories \
    && echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories \
    \
    # Add the packages
    && apk add --no-cache dumb-init curl make gcc g++ python linux-headers binutils-gold gnupg libstdc++ nss chromium \
    \
    && npm install puppeteer@0.13.0 \
    \
    # Do some cleanup
    && apk del --no-cache make gcc g++ python binutils-gold gnupg libstdc++ \
    && rm -rf /usr/include \
    && rm -rf /var/cache/apk/* /root/.node-gyp /usr/share/man /tmp/* \
    && echo

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PORT=3000

RUN adduser -S hawkeye

WORKDIR /app

RUN chown -R hawkeye /app

USER hawkeye

COPY package*.json ./

RUN npm install --only=production

COPY --from=build /app/dist ./dist

EXPOSE ${PORT}

CMD ["npm", "run", "start:prod"]