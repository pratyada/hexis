FROM node:20-slim

# Tesseract system dependencies
RUN apt-get update && apt-get install -y \
    libtesseract-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/server.js"]
