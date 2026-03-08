# Используем официальный образ Node.js
FROM node:18-alpine AS base

# Устанавливаем зависимости для Prisma (openssl)
RUN apk add --no-cache openssl

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем весь проект
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Сборка Next.js приложения
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
