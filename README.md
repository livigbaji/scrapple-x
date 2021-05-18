# ScrapleX

[![Test and Deploy](https://github.com/bestbrain10/scrapple-x/actions/workflows/pipelines.yml/badge.svg)](https://github.com/bestbrain10/scrapple-x/actions/workflows/pipelines.yml)

# Live API

https://scrapple-x.herokuapp.com/


## How to Install

Install NodeJS and NPM. Use this link and follow the steps for your own operating system https://nodejs.org/en/download/

Install Git from https://git-scm.com/downloads

From your terminal or command line run

```bash
# clone from githhub
$ git clone git@github.com:bestbrain10/scrapple-x.git

# move into project directory
$ cd scrapple-x

# install dependencies using NPM
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Running with docker

```bash
# build the image
$ docker build -t scrapplex .

# run the image container, mapping it to port 3000 from the container to you computer port 3000
$ docker run scrapplex -p 3000:3000

```
## Accessing GraphQL playground

`http://localhost:3000/`

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```