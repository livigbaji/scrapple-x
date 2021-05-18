FROM node:14-alpine3.10 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --only=development

COPY . .

RUN npm run build

FROM node:14-alpine3.10 AS release

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN adduser -S hawkeye

RUN chown -R hawkeye /app

WORKDIR /app

USER hawkeye

COPY package*.json ./

RUN npm install --only=production

COPY . .

COPY --from=build /app/dist ./dist

CMD ["npm", "start:prod"]