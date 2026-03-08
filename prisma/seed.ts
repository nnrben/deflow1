// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Создаём тестового пользователя, если его нет
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Тестовый Пользователь',
      balance: 5000,
    },
  })

  // Создаём несколько рынков
  await prisma.market.createMany({
    data: [
      {
        question: 'Будет ли биткоин выше $100 000 к концу 2025 года?',
        description: 'Прогноз на основе открытых данных',
        endDate: new Date('2025-12-31T23:59:59Z'),
        creatorId: user.id,
      },
      {
        question: 'Состоится ли запуск Starship в 2025 году?',
        endDate: new Date('2025-12-31T23:59:59Z'),
        creatorId: user.id,
      },
    ],
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })