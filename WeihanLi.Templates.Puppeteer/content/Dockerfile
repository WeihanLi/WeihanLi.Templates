FROM weihanli/puppeteer:node12-slim-stable

LABEL maintainer="weihanli@outlook.com"

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_HEADLESS true

COPY package.json ./
RUN  yarn 

COPY --chown=pptruser:pptruser . ./

EXPOSE 3000