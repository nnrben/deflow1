import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import Parser from 'rss-parser';

const prisma = new PrismaClient();
const parser = new Parser();

// Источники RSS
const RSS_FEEDS = [
    'https://www.economist.com/feeds/print-sections/77/business.xml',
    // Добавьте российские издания по необходимости
];

// Функция для парсинга RSS
async function parseRSS() {
    for (const feedUrl of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);
            for (const item of feed.items) {
                // Проверяем, нет ли уже такой новости (по заголовку)
                const existing = await prisma.rawNews.findUnique({
                    where: { title: item.title }
                });
                if (!existing && item.title && item.content) {
                    await prisma.rawNews.create({
                        data: {
                            title: item.title,
                            content: item.content,
                            source: feedUrl,
                            url: item.link,
                            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                            processed: false,
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`Ошибка парсинга RSS ${feedUrl}:`, error);
        }
    }
}

// Функция для вызова GDELT API
async function fetchGDELT() {
    // GDELT Doc API: http://api.gdeltproject.org/api/v2/doc/doc
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    try {
        const response = await axios.get('http://api.gdeltproject.org/api/v2/doc/doc', {
            params: {
                query: 'economy OR politics OR "interest rate"',
                mode: 'artlist',
                format: 'json',
                startdate: dateStr,
                enddate: dateStr
            }
        });
        
        if (response.data && response.data.articles) {
            for (const article of response.data.articles) {
                await prisma.rawNews.create({
                    data: {
                        title: article.title,
                        content: article.body || article.title,
                        source: article.domain,
                        url: article.url,
                        publishedAt: new Date(article.seendate),
                        processed: false,
                    }
                });
            }
        }
    } catch (error) {
        console.error('Ошибка GDELT:', error);
    }
}

// Запускаем сбор по расписанию
export function startNewsCollector() {
    // Каждый час
    setInterval(async () => {
        await parseRSS();
        await fetchGDELT();
    }, 60 * 60 * 1000);
}
