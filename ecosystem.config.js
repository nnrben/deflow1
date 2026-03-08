module.exports = {
    apps: [
        { name: 'next-app', script: 'npm', args: 'start' },
        { name: 'news-collector', script: 'dist/services/news-collector.js' },
        { name: 'forecast-generator', script: 'dist/services/forecast-generator.js' },
        { name: 'trader-bot', script: 'dist/services/trader-bot.js' }
    ]
};
