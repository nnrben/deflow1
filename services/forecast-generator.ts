import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
    
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Gemini failed, trying OpenRouter...', e);
        try {
            const openrouterResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'anthropic/claude-3.5-sonnet',
                messages: [{ role: 'user', content: prompt }],
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            const content = openrouterResponse.data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e2) {
            console.error('All LLMs failed', e2);
            return null;
        }
    }
}

export async function processUnprocessedNews() {
    const news = await prisma.rawNews.findMany({
        where: { processed: false },
        take: 10,
    });
    
    for (const item of news) {
        const marketData = await generateMarketFromNews(item.title, item.content);
        
        if (marketData && marketData.question) {
            try {
                await axios.post('http://localhost:3000/api/markets', {
                    question: marketData.question,
                    description: marketData.description,
                    endDate: marketData.endDate,
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.BOT_API_SECRET}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`✅ Создан рынок: ${marketData.question}`);
            } catch (error) {
                console.error('Ошибка создания рынка:', error);
            }
        }
        
        await prisma.rawNews.update({
            where: { id: item.id },
            data: { processed: true }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

export function startForecastGenerator() {
    setInterval(async () => {
        await processUnprocessedNews();
    }, 30 * 60 * 1000);
}

if (require.main === module) {
    startForecastGenerator();
    console.log('🤖 Forecast generator started');
    process.stdin.resume();
}
