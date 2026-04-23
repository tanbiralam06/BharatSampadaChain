FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript && npx tsc

EXPOSE 4000
CMD ["node", "dist/index.js"]
