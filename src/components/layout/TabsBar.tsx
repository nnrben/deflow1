// src/components/layout/TabsBar.tsx
'use client';

import { useState, useEffect } from 'react';

interface TabsBarProps {
  activeTab: 'news' | 'analytics' | 'blog';
  onTabChange: (tab: 'news' | 'analytics' | 'blog') => void;
}

export default function TabsBar({ activeTab, onTabChange }: TabsBarProps) {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    updateHeaderHeight();

    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  return (
    <div
      style={{ position: 'sticky', top: headerHeight, zIndex: 10 }}
      className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 mb-4"
    >
      <div className="flex gap-4">
        <button
          className={`py-2 px-1 text-base font-medium transition-colors ${
            activeTab === 'news'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => onTabChange('news')}
        >
          Новости
        </button>
        <button
          className={`py-2 px-1 text-base font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => onTabChange('analytics')}
        >
          Аналитика
        </button>
        <button
          className={`py-2 px-1 text-base font-medium transition-colors ${
            activeTab === 'blog'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => onTabChange('blog')}
        >
          Блог
        </button>
      </div>
    </div>
  );
}