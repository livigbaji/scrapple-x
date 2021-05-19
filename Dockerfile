FROM node:14-alpine3.10 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# release image

FROM alpine:edge

# Installs latest Chromium (89) package.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    npm

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./

RUN npm install --only=production

# Add user so we don't need --no-sandbox.
RUN addgroup -S hawkeye && adduser -S -g hawkeye hawkeye \
    && mkdir -p /home/hawkeye/Downloads /app \
    && chown -R hawkeye:hawkeye /home/hawkeye \
    && chown -R hawkeye:hawkeye /app
RUN chown root:root /usr/lib/chromium/chrome-sandbox
RUN chmod 4755 /usr/lib/chromium/chrome-sandbox

# Run everything after as non-privileged user.
USER hawkeye

COPY --from=build /app/dist ./dist

WORKDIR /app

EXPOSE ${PORT}

CMD ["npm", "run", "start:prod"]