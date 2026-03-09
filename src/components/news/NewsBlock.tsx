'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

interface NewsItem {
  title: string;
  date: string;
  ticker: string;
}

const CACHE_TTL = 30 * 60 * 1000;

const TICKERS = [
  { code: "SBER", name: "Сбербанк" },
  { code: "GAZP", name: "Газпром" },
  { code: "LKOH", name: "Лукойл" },
  { code: "NVTK", name: "Новатэк" },
  { code: "GMKN", name: "Норникель" },
  { code: "ROSN", name: "Роснефть" },
  { code: "TATN", name: "Татнефть" },
  { code: "VTBR", name: "ВТБ" },
  { code: "ALRS", name: "Алроса" },
  { code: "YNDX", name: "Яндекс" },
  { code: "POLY", name: "Полиметалл" },
  { code: "MAGN", name: "ММК" },
  { code: "MTSS", name: "МТС" },
  { code: "CHMF", name: "Северсталь" },
  { code: "AFKS", name: "АФК Система" },
  { code: "PLZL", name: "Полюс" },
  { code: "MGNT", name: "Магнит" },
  { code: "RTKM", name: "Ростелеком" },
  { code: "HYDR", name: "РусГидро" },
  { code: "MOEX", name: "МосБиржа" },
  { code: "TRNFP", name: "Транснефть-п" },
  { code: "FEES", name: "ФСК ЕЭС" },
  { code: "SNGS", name: "Сургутнефтегаз" },
  { code: "BANEP", name: "Башнефть-п" },
  { code: "SIBN", name: "Газпром нефть" },
  { code: "FLOT", name: "Совкомфлот" },
  { code: "LSRG", name: "ЛСР" },
  { code: "RUAL", name: "РУСАЛ" },
  { code: "PIKK", name: "ПИК" },
  { code: "OZON", name: "Ozon" },
  { code: "TCSG", name: "TCS Group" },
  { code: "POSI", name: "Positive" },
  { code: "CBOM", name: "МКБ" },
  { code: "GLTR", name: "Globaltrans" },
  { code: "IRAO", name: "Интер РАО" },
  { code: "NKNC", name: "НКНХ" },
  { code: "KZOS", name: "Казаньоргсинтез" },
  { code: "LENT", name: "Лента" },
  { code: "BELU", name: "НоваБев Групп" },
  { code: "MSRS", name: "Россети" },
  { code: "TGKA", name: "ТГК-1" },
  { code: "TGKN", name: "ТГК-2" },
  { code: "RASP", name: "Распадская" },
  { code: "SFIN", name: "ЭсЭфАй" },
  { code: "BSPB", name: "Банк Санкт-Петербург" },
  { code: "RBCM", name: "РБК" },
  { code: "LSNG", name: "Ленэнерго" },
  { code: "MVID", name: "М.видео" },
  { code: "NLMK", name: "НЛМК" },
  { code: "PHOR", name: "ФосАгро" },
  { code: "PMSB", name: "Промсвязьбанк" },
  { code: "SELG", name: "Селигдар" },
  { code: "SGZH", name: "Сегежа" },
  { code: "UCSS", name: "Юнипро" }
];

const NewsBlock: React.FC = () => {
  const [selectedTicker, setSelectedTicker] = useState<string>("ALL");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableTickers, setAvailableTickers] = useState<Set<string>>(new Set());
  const [tickersLoading, setTickersLoading] = useState(true);
  const [showAllTickers, setShowAllTickers] = useState(false);
  const [visibleCount, setVisibleCount] = useState(
    selectedTicker === "ALL" ? 80 : 25
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const DARK_COLORS = {
    background: "#000000",
    cardBg: "#121212",
    surface: "#1E1E1E",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    border: "#2A2A2A",
    hoverBg: "rgba(255, 255, 255, 0.1)"
  };

  const LIGHT_COLORS = {
    background: "#FFFFFF",
    cardBg: "#FFFFFF",
    surface: "#F8F9FA",
    textPrimary: "#000000",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    hoverBg: "rgba(0, 0, 0, 0.05)"
  };

  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

  const parseNewsDate = (dateStr: string): Date => {
    const [day, month] = dateStr.split("/").map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const newsDate = new Date(currentYear, month - 1, day);
    if (newsDate > now) {
      return new Date(currentYear - 1, month - 1, day);
    }
    return newsDate;
  };

  const fetchNews = async (ticker: string): Promise<NewsItem[]> => {
    const cacheKey = `news_${ticker}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      const now = Date.now();
      if (now - timestamp < CACHE_TTL) {
        return data;
      }
    }

    try {
      const res = await axios.get(`https://nnrben-support-e47e.twc1.net/api/autonews/${ticker}`);
      const fetchedNews = res.data.news.map((n: any) => ({ ...n, ticker }));

      localStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), data: fetchedNews })
      );

      return fetchedNews;
    } catch (err) {
      console.error(`Ошибка при загрузке новостей для ${ticker}`, err);
      return cached ? JSON.parse(cached).data : [];
    }
  };

  useEffect(() => {
    const loadAvailableTickers = async () => {
      const tickersWithNews = new Set<string>();
      for (const t of TICKERS) {
        const tickerNews = await fetchNews(t.code);
        if (tickerNews.length > 0) {
          tickersWithNews.add(t.code);
        }
      }
      setAvailableTickers(tickersWithNews);
      setTickersLoading(false);
    };
    loadAvailableTickers();
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      let allNews: NewsItem[] = [];

      if (selectedTicker === "ALL") {
        const tickersToLoad = tickersLoading
          ? TICKERS.map(t => t.code)
          : TICKERS.filter(t => availableTickers.has(t.code)).map(t => t.code);

        for (const tickerCode of tickersToLoad) {
          const tickerNews = await fetchNews(tickerCode);
          allNews = [...allNews, ...tickerNews];
        }
      } else {
        allNews = await fetchNews(selectedTicker);
      }

      allNews = allNews.filter(item => 
        !item.title.includes('📉Акции по "акции": Мосэнерго ₽2, Позитив - ₽1000, Аэрофлот - ₽50, ВК - ₽260, МТС - ₽200, НЛМК - ₽100, Распадская - ₽170, Роснефть - ₽400, Самолет - ₽900, Северсталь - ₽900, Совкомбанк - ₽12')
      );

      allNews.sort((a, b) => parseNewsDate(b.date).getTime() - parseNewsDate(a.date).getTime());
      setNews(allNews);
      setVisibleCount(selectedTicker === "ALL" ? 80 : 25);
      setLoading(false);
    };

    loadNews();
  }, [selectedTicker, availableTickers, tickersLoading]);

  const handleLoadMore = () => setVisibleCount(prev => prev + 25);

  const handleTickerSelect = (tickerCode: string) => {
    setSelectedTicker(tickerCode);
    setShowAllTickers(false);
  };

  const handleToggleAllTickers = () => {
    setShowAllTickers(prev => !prev);
  };

  const placeholderCards = Array.from({ length: 5 });
  const placeholderTickers = Array.from({ length: 4 });
  const displayedNews = news.slice(0, visibleCount);
  
  const availableTickersList = TICKERS
    .filter(t => availableTickers.has(t.code))
    .sort((a, b) => a.name.localeCompare(b.name));

  let visibleTickers;
  if (showAllTickers) {
    visibleTickers = availableTickersList;
  } else {
    if (selectedTicker !== "ALL") {
      const selectedTickerObj = availableTickersList.find(t => t.code === selectedTicker);
      const otherTickers = availableTickersList
        .filter(t => t.code !== selectedTicker)
        .slice(0, 2);
      visibleTickers = selectedTickerObj ? [selectedTickerObj, ...otherTickers] : otherTickers;
    } else {
      visibleTickers = availableTickersList.slice(0, 3);
    }
  }

  return (
<div 
  className="transition-all duration-500 ease-in-out"
  style={{
    backgroundColor: colors.cardBg,
    color: colors.textPrimary
  }}
>

        <div>
        <h2 
          className="text-xl font-semibold mb-4"
          style={{ color: colors.textPrimary }}
        >
          Новостная лента
        </h2>

        <div 
          className="flex flex-wrap items-center gap-1 mb-4"
          style={{ color: colors.textPrimary }}
        >
          <button
            onClick={() => handleTickerSelect("ALL")}
            style={{
              backgroundColor: selectedTicker === "ALL" ? '#3b82f6' : colors.hoverBg,
              color: selectedTicker === "ALL" ? '#ffffff' : colors.textPrimary
            }}
            className="px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200"
          >
            Все
          </button>

          {tickersLoading
            ? placeholderTickers.map((_, idx) => (
                <div 
                  key={idx} 
                  className="px-2 py-1 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.hoverBg }}
                >
                  <div 
                    className="h-3 w-12 rounded"
                    style={{ backgroundColor: colors.textSecondary }}
                  />
                </div>
              ))
            : visibleTickers.map(t => (
                <button
                  key={t.code}
                  onClick={() => handleTickerSelect(t.code)}
                  style={{
                    backgroundColor: selectedTicker === t.code ? '#3b82f6' : colors.hoverBg,
                    color: selectedTicker === t.code ? '#ffffff' : colors.textPrimary
                  }}
                  className="px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200"
                >
                  {t.name}
                </button>
              ))}

          {!tickersLoading && availableTickersList.length > 3 && (
            <button
              onClick={handleToggleAllTickers}
              style={{
                backgroundColor: colors.hoverBg,
                color: colors.textPrimary
              }}
              className="px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 flex items-center gap-1"
            >
              {showAllTickers ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </button>
          )}
        </div>

        <ul className="space-y-3">
          {loading
            ? placeholderCards.map((_, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl border flex flex-col space-y-2 animate-pulse"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border
                  }}
                >
                  <div 
                    className="h-3 w-20 rounded"
                    style={{ backgroundColor: colors.textSecondary }}
                  />
                  <div 
                    className="h-4 w-full rounded"
                    style={{ backgroundColor: colors.textSecondary }}
                  />
                  <div 
                    className="h-4 w-5/6 rounded"
                    style={{ backgroundColor: colors.textSecondary }}
                  />
                </li>
              ))
            : displayedNews.map((item, idx) => (
                <li 
                  key={idx} 
                  className="p-3 rounded-xl border flex flex-col transition-colors duration-200"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }}
                >
                  <div 
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.date} • {item.ticker}
                  </div>
                  <div 
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {item.title}
                  </div>
                </li>
              ))}
        </ul>

        {!loading && visibleCount < news.length && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleLoadMore}
              className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition text-sm transition-colors duration-200"
            >
              Ещё
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsBlock;