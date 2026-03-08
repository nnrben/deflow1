import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception in forecast-generator:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection in forecast-generator at:', promise, 'reason:', reason);
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not set, Gemini will not work');
}
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const geminiModel = genAI?.getGenerativeModel({ model: 'gemini-1.5-pro' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ OPENROUTER_API_KEY not set, OpenRouter fallback will not work');
}

const BOT_API_SECRET = process.env.BOT_API_SECRET;
if (!BOT_API_SECRET) {
    console.warn('⚠️ BOT_API_SECRET not set, API calls will fail');
}

const FORECAST_PROMPT = `Ты — аналитик на платформе рынков предсказаний. Прочитай новость и создай на её основе один вопрос для прогноза, который будет интересен и проверяем.

Правила вопроса:
1. Вопрос должен быть чётким и допускать только ответ "Да" или "Нет".
2. Вопрос должен касаться будущего события, которое разрешится в течение 1-3 месяцев.
3. Дай понятные критерии разрешения: при каком событии ответ "Да".
4. Оцени базовую вероятность (0-100%) на основе здравого смысла.

Новость: 
{{новость}}

Ответ строго в формате JSON:
{
  "question": "Вопрос для рынка",
  "description": "Краткое описание для пользователей",
  "resolution_criteria": "Чёткие критерии разрешения",
  "endDate": "Дата окончания в формате ISO (например, 2026-04-30T23:59:59Z)",
  "base_probability": число (0-100)
}`;

async function generateMarketFromNews(newsTitle: string, newsContent: string) {
    const prompt = FORECAST_PROMPT.replace('{{новость}}', `Заголовок: ${newsTitle}\nТекст: ${newsContent}`);

    if (geminiModel) {
        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Gemini failed:', e);
        }
    }

    if (OPENROUTER_API_KEY) {
        try {
            const openrouterResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'anthropic/claude-3.5-sonnet',
                messages: [{ role: 'user', content: prompt }],
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            const content = openrouterResponse.data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e2) {
            console.error('OpenRouter failed:', e2);
        }
    }

    return null;
}

export async function processUnprocessedNews() {
    console.log('📊 Checking for unprocessed news...');
    const news = await prisma.rawNews.findMany({
        where: { processed: false },
        take: 10,
    });

    console.log(`📰 Found ${news.length} unprocessed news`);
    let created = 0;

    for (const item of news) {
        console.log(`🔍 Analyzing: ${item.title.substring(0, 60)}...`);
        const marketData = await generateMarketFromNews(item.title, item.content);

        if (marketData && marketData.question) {
            try {
                await axios.post('http://localhost:3000/api/markets', {
                    question: marketData.question,
                    description: marketData.description,
                    endDate: marketData.endDate,
                }, {
                    headers: {
                        'Authorization': `Bearer ${BOT_API_SECRET}`,
                        'Content-Type': 'application/json',
                    },
                });
                console.log(`✅ Market created: ${marketData.question.substring(0, 60)}...`);
                created++;
            } catch (error) {
                console.error('❌ Error creating market:', error);
            }
        } else {
            console.log(`⏩ No valid market generated for: ${item.title.substring(0, 60)}...`);
        }

        await prisma.rawNews.update({
            where: { id: item.id },
            data: { processed: true },
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`📊 Done. Created ${created} markets.`);
}

export function startForecastGenerator() {
    console.log('🤖 Forecast generator started');

    setTimeout(async () => {
        console.log('🔄 Immediate run on start');
        await processUnprocessedNews();
    }, 5000);

    setInterval(async () => {
        console.log('🔄 Scheduled run', new Date().toISOString());
        await processUnprocessedNews();
    }, 30 * 60 * 1000);
}

if (require.main === module) {
    startForecastGenerator();
    process.stdin.resume();
}
