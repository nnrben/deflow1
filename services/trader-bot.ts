import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function getActiveMarkets() {
    const response = await axios.get('http://localhost:3000/api/markets');
    return response.data.filter((m: any) => 
        m.status === 'ACTIVE' && new Date(m.endDate) > new Date()
    );
}

function calculateSentiment(market: any) {
    const total = market._count?.bets || 0;
    return { yesPercent: 50, noPercent: 50 };
}

function decideBet(market: any) {
    const sentiment = calculateSentiment(market);
    const rand = Math.random();
    
    if (rand < 0.3) {
        return null;
    }
    
    if (sentiment.yesPercent > 70) {
        return { outcome: false, amount: Math.floor(Math.random() * 20) + 5 };
    }
    if (sentiment.noPercent > 70) {
        return { outcome: true, amount: Math.floor(Math.random() * 20) + 5 };
    }
    
    return {
        outcome: Math.random() > 0.5,
        amount: Math.floor(Math.random() * 30) + 5
    };
}

export async function runTradingCycle() {
    const bots = await prisma.user.findMany({
        where: { isBot: true }
    });
    
    if (bots.length === 0) {
        console.log('Нет ботов в системе. Создайте их через админку.');
        return;
    }
    
    const markets = await getActiveMarkets();
    
    for (const market of markets) {
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
                            'user-id': bot.id
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

export function startTraderBot() {
    setInterval(async () => {
        await runTradingCycle();
    }, 15 * 60 * 1000);
}

if (require.main === module) {
    startTraderBot();
    console.log('💰 Trader bot started');
    process.stdin.resume();
}
