FROM node:12.16.1-alpine AS node
ENV NODE_ENV=development
ENV NODE_OPTIONS --unhandled-rejections=strict
WORKDIR /app

COPY package.json \
    package-lock.json \
    tsconfig.json \
    ./

RUN npm install

COPY src/ src/

CMD ["npm", "start"]
