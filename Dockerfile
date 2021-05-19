FROM node:14-alpine3.10 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# release image

FROM node:14 AS release

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