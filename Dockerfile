FROM node:22-alpine AS base

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build       
RUN npx tsc              

RUN npm install -g pm2

EXPOSE 3000

CMD ["npm", "start"]
