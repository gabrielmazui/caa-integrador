FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN node build-css.mjs

EXPOSE 4200

CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--proxy-config", "proxy.conf.json"]
