import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception in forecast-generator:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection in forecast-generator at:', promise, 'reason:', reason);
});

// --- Настройки GigaChat ---
const GIGACHAT_KEY = process.env.GIGACHAT_KEY;
const BOT_API_SECRET = process.env.BOT_API_SECRET;

if (!GIGACHAT_KEY) {
    console.error('❌ GIGACHAT_KEY not set. Forecast generator cannot work.');
    process.exit(1);
}
if (!BOT_API_SECRET) {
    console.warn('⚠️ BOT_API_SECRET not set, API calls will fail');
}

// Декодируем ключ (ожидается в формате base64 "client_id:client_secret")
let GIGACHAT_CLIENT_ID = '';
let GIGACHAT_CLIENT_SECRET = '';
try {
    const decoded = Buffer.from(GIGACHAT_KEY, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length === 2) {
        GIGACHAT_CLIENT_ID = parts[0];
        GIGACHAT_CLIENT_SECRET = parts[1];
    } else {
        throw new Error('Invalid GIGACHAT_KEY format');
    }
} catch (e) {
    console.error('❌ Failed to parse GIGACHAT_KEY. It must be base64 of "client_id:client_secret"', e);
    process.exit(1);
}

// Создаём агент HTTPS, который не проверяет сертификаты (для самоподписанных сертификатов Сбера)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Токен доступа GigaChat
let gigachatAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function ensureGigaChatToken() {
    if (gigachatAccessToken && Date.now() < tokenExpiresAt) {
        return gigachatAccessToken;
    }
    try {
        const params = new URLSearchParams();
        params.append('scope', 'GIGACHAT_API_PERS');

        const response = await axios.post(
            'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
            params.toString(),
            {
                httpsAgent,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${Buffer.from(`${GIGACHAT_CLIENT_ID}:${GIGACHAT_CLIENT_SECRET}`).toString('base64')}`,
                    'RqUID': uuidv4(), // уникальный UUID для каждого запроса
                },
            }
        );

        gigachatAccessToken = response.data.access_token;
        tokenExpiresAt = Date.now() + (response.data.expires_at ? response.data.expires_at * 1000 : 30 * 60 * 1000);
        console.log('✅ GigaChat token obtained');
        return gigachatAccessToken;
    } catch (error) {
        console.error('❌ Failed to obtain GigaChat token:', error);
        throw error;
    }
}

async function callGigaChat(prompt: string): Promise<any | null> {
    try {
        const token = await ensureGigaChatToken();
        const response = await axios.post(
            'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
            {
                model: 'GigaChat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000,
            },
            {
                httpsAgent, // используем агент без проверки сертификатов
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
            console.log('⚠️ Empty response from GigaChat');
            return null;
        }

        console.log('📨 GigaChat raw response:', content.substring(0, 200));
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            console.log('⚠️ No JSON found in response');
            return null;
        }
    } catch (error: any) {
        if (error.response && error.response.status === 401) {
            console.warn('⚠️ Token expired, retrying...');
            gigachatAccessToken = null; // принудительно обновим токен при следующем вызове
        } else {
            console.error('❌ GigaChat API error:', error.message);
        }
        return null;
    }
}

// --- Промпт для генерации рынка ---
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
    return await callGigaChat(prompt);
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
            } catch (error: any) {
                console.error('❌ Error creating market:', error.message);
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
    console.log('🤖 Forecast generator started (GigaChat)');

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
