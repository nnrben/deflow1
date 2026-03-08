// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import YandexProvider from 'next-auth/providers/yandex'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID || '',
      clientSecret: process.env.YANDEX_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'login:email login:info',
        },
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.balance = user.balance
      }
      return session
    },
  },
}

// Расширяем типы NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      balance: number
      name?: string | null
      email?: string | null
    }
  }
  interface User {
    balance: number
  }
}