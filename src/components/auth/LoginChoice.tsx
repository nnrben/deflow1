// src/components/auth/LoginChoice.tsx
'use client'

import { signIn } from 'next-auth/react'

export default function LoginChoice() {
  return (
    <div className="min-h-screen flex py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Авторизация
          </h2>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={() => signIn('yandex', { callbackUrl: '/' })}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Войти c Яндекс ID
          </button>

          <button
            onClick={() => signIn('telegram', { callbackUrl: '/' })}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Войти c Telegram
          </button>
        </div>
      </div>
    </div>
  )
}
