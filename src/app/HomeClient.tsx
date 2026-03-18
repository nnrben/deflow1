// src/app/HomeClient.tsx
'use client';

import { useState } from 'react';
import NewsBlock from '@/components/news/NewsBlock';
import TabsBar from '@/components/layout/TabsBar';
import BlogTab from '@/components/blog/BlogTab';

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState<'news' | 'analytics' | 'blog'>('news');

  return (
    <>
      {/* Панель вкладок */}
      <TabsBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'blog' ? (
        <div className="flex justify-center mt-4">
          <div className="w-full max-w-5xl bg-gray-50 rounded-xl border border-gray-200 px-6 py-5">
            <BlogTab />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          {/* Левая колонка */}
          <div className="hidden lg:block">
            {/* контент */}
          </div>

          {/* Правая колонка */}
          <div>
            {activeTab === 'news' && <NewsBlock />}
            {activeTab === 'analytics' && (
              <div className="text-center py-10 text-gray-600">
                Раздел аналитика в разработке
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}