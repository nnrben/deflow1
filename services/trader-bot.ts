import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Получаем активные рынки
async function getActiveMarkets() {
    const response = await axios.get('http://localhost:3000/api/markets');
    return response.data.filter((m: any) => 
        m.status === 'ACTIVE' && new Date(m.endDate) > new Date()
    );
}

// Анализ рынка: считаем процент ставок
function calculateSentiment(market: any) {
    const total = market._count?.bets || 0;
    // Здесь должна быть более сложная логика, 
    // но для примера используем заглушку
    return { yesPercent: 50, noPercent: 50 };
}

// Принимаем решение о ставке
function decideBet(market: any) {
    const sentiment = calculateSentiment(market);
    
    // Симуляция разных стратегий
    const rand = Math.random();
    
    // 30% шанс, что бот вообще поставит
    if (rand < 0.3) {
        return null;
    }
    
    // Если перекос в ставках > 70%, бот ставит на аутсайдера (имитация умной игры)
    if (sentiment.yesPercent > 70) {
        return { outcome: false, amount: Math.floor(Math.random() * 20) + 5 };
    }
    if (sentiment.noPercent > 70) {
        return { outcome: true, amount: Math.floor(Math.random() * 20) + 5 };
    }
    
    // Иначе случайная ставка
    return {
        outcome: Math.random() > 0.5,
        amount: Math.floor(Math.random() * 30) + 5
    };
}

// Основной цикл торговли
export async function runTradingCycle() {
    // Получаем список ботов-пользователей (специальные аккаунты)
    const bots = await prisma.user.findMany({
        where: { isBot: true } // Добавьте поле isBot в модель User
    });
    
    if (bots.length === 0) {
        console.log('Нет ботов в системе. Создайте их через админку.');
        return;
    }
    
    const markets = await getActiveMarkets();
    
    for (const market of markets) {
        // Торгуем на каждом рынке
        for (const bot of bots) {
            const bet = decideBet(market);
            if (bet) {
                try {
                    await axios.post(`http://localhost:3000/api/markets/${market.id}/bets`, {
                        outcome: bet.outcome,
                        amount: bet.amount
                    }, {
                        headers: {
                            'Authorization': `Bearer ${process.env.BOT_API_SECRET}`,
                            'user-id': bot.id // Передаём ID бота
                        }
                    });
                    console.log(`Бот ${bot.id} поставил ${bet.amount} на ${bet.outcome ? 'ДА' : 'НЕТ'}`);
                } catch (error) {
                    console.error('Ошибка ставки бота:', error);
                }
            }
        }
    }
}

// Запускаем торговлю каждые 15 минут
export function startTraderBot() {
    setInterval(async () => {
        await runTradingCycle();
    }, 15 * 60 * 1000);
}
