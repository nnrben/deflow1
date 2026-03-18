const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureBotUser() {
  // Используется в /api/markets, когда запрос идёт от бота по BOT_API_SECRET
  return prisma.user.upsert({
    where: { email: 'bot@deflow.local' },
    update: { isBot: true, name: 'Deflow Bot', balance: 0 },
    create: {
      email: 'bot@deflow.local',
      name: 'Deflow Bot',
      balance: 0,
      isBot: true,
    },
    select: { id: true },
  })
}

async function ensureDemoUser() {
  // Нужен только для демо-данных (статья/рынок), авторизация всё равно через NextAuth OAuth
  return prisma.user.upsert({
    where: { email: 'demo@deflow.local' },
    update: { name: 'Demo User', balance: 1000, isBot: false },
    create: {
      email: 'demo@deflow.local',
      name: 'Demo User',
      balance: 1000,
      isBot: false,
    },
    select: { id: true },
  })
}

async function seedMarkets(creatorId) {
  const existing = await prisma.market.count()
  if (existing > 0) return

  const now = new Date()
  const ended = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 часа назад
  const endsSoon = new Date(now.getTime() + 24 * 60 * 60 * 1000) // через сутки

  await prisma.market.createMany({
    data: [
      {
        question: 'BTC будет выше $100k к концу месяца?',
        description: 'Демо-рынок для проверки UI/ставок.',
        endDate: endsSoon,
        status: 'ACTIVE',
        creatorId,
      },
      {
        question: 'Ставка ЦБ РФ будет снижена на следующем заседании?',
        description: 'Демо-рынок (уже завершён) — пригодится для проверки резолва.',
        endDate: ended,
        status: 'ACTIVE',
        creatorId,
      },
    ],
  })
}

async function seedArticles(authorId) {
  const existing = await prisma.article.count()
  if (existing > 0) return

  await prisma.article.create({
    data: {
      title: 'Добро пожаловать в блог',
      contentMd: `# Добро пожаловать

Это демо-статья, чтобы вкладка **Блог** выглядела живой сразу после запуска.

## Что дальше

- создавайте статьи в Markdown
- смотрите превью справа
- редактировать/удалять может только автор
`,
      authorId,
    },
  })
}

async function main() {
  const bot = await ensureBotUser()
  const demo = await ensureDemoUser()

  await seedMarkets(bot.id)
  await seedArticles(demo.id)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

