// src/app/HomeClient.tsx
'use client';

import { useState } from 'react';
import NewsBlock from '@/components/news/NewsBlock';
import TabsBar from '@/components/layout/TabsBar';

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState<'news' | 'analytics' | 'blog'>('news');

  return (
    <>
      {/* Панель вкладок */}
      <TabsBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Две колонки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Левая колонка */}
        <div className="hidden lg:block">
          {/* контент */}
        </div>

        {/* Правая колонка */}
        <div>
          {activeTab === 'news' && <NewsBlock />}
          {activeTab === 'analytics' && (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Раздел аналитика в разработке
            </div>
          )}
          {activeTab === 'blog' && (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Раздел блог в разработке
            </div>
          )}
        </div>
      </div>
    </>
  );
}