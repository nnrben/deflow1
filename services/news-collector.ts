import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import Parser from 'rss-parser';

const prisma = new PrismaClient();
const parser = new Parser();

const RSS_FEEDS = [
    // Российские источники
    'https://lenta.ru/rss/top7',           

];

async function parseRSS() {
    console.log('📡 Начинаем парсинг RSS...');
    let totalAdded = 0;
    
    for (const feedUrl of RSS_FEEDS) {
        try {
            console.log(`Читаем RSS: ${feedUrl}`);
            const feed = await parser.parseURL(feedUrl);
            console.log(`Получено ${feed.items.length} записей из ${feedUrl}`);
            
            for (const item of feed.items) {
                if (!item.title || !item.content) continue;
                
                const existing = await prisma.rawNews.findUnique({
                    where: { title: item.title }
                });
                
                if (!existing) {
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
                    totalAdded++;
                    console.log(`✅ Добавлена новость: ${item.title.substring(0, 50)}...`);
                }
            }
        } catch (error) {
            console.error(`❌ Ошибка парсинга RSS ${feedUrl}:`, error);
        }
    }
    console.log(`📊 Итого добавлено новых новостей: ${totalAdded}`);
}

async function fetchGDELT() {
    console.log('📡 Запрос к GDELT API...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    try {
        const response = await axios.get('http://api.gdeltproject.org/api/v2/doc/doc', {
            params: {
                query: 'economy OR politics OR "interest rate" OR Russia OR Украина',
                mode: 'artlist',
                format: 'json',
                startdate: dateStr,
                enddate: dateStr,
                maxrecords: 50  
            }
        });
        
        if (response.data && response.data.articles) {
            console.log(`GDELT вернул ${response.data.articles.length} статей`);
            let added = 0;
            
            for (const article of response.data.articles) {
                const existing = await prisma.rawNews.findUnique({
                    where: { title: article.title }
                });
                
                if (!existing) {
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
                    added++;
                }
            }
            console.log(`✅ Добавлено новостей из GDELT: ${added}`);
        } else {
            console.log('GDELT не вернул статей');
        }
    } catch (error) {
        console.error('❌ Ошибка GDELT:', error);
    }
}

export function startNewsCollector() {
    console.log('📰 News collector started');
    
    setTimeout(async () => {
        await parseRSS();
        await fetchGDELT();
    }, 5000);  
    
    setInterval(async () => {
        console.log('🔄 Запуск цикла сбора новостей', new Date().toISOString());
        await parseRSS();
        await fetchGDELT();
    }, 60 * 60 * 1000); 
}

if (require.main === module) {
    startNewsCollector();
    process.stdin.resume();
}
