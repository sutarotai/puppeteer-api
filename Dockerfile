# Sử dụng image nhẹ có sẵn Chromium
FROM node:20-slim

# Cài dependencies cần thiết cho Puppeteer và Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

# Tạo thư mục app
WORKDIR /app

# Sao chép file
COPY package.json ./
RUN npm install
COPY . .

# Mở port
EXPOSE 3000

# Start server
CMD ["node", "index.js"]
