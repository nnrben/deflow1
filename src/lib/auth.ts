// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import YandexProvider from 'next-auth/providers/yandex'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
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
    {
      id: 'telegram',
      name: 'Telegram',
      type: 'oauth',
      clientId: process.env.TELEGRAM_CLIENT_ID,
      clientSecret: process.env.TELEGRAM_CLIENT_SECRET,
      wellKnown: 'https://oauth.telegram.org/.well-known/openid-configuration',
      authorization: {
        params: {
          scope: 'openid profile phone',
        },
      },
      profile(profile) {
        console.log('[Telegram Profile]', profile)
        return {
          id: profile.sub,
          telegramId: profile.sub,
          name: profile.name || profile.preferred_username,
          image: profile.picture,
          balance: 1000,
        }
      },
    },
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      console.log('[Session callback] Called with user:', user?.id)
      if (session.user) {
        session.user.id = user.id
        session.user.balance = user.balance
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('[signIn callback] User:', user?.id, 'Account:', account?.provider)
      return true
    },
    async jwt({ token, user }) {
      console.log('[jwt callback] Token:', token, 'User:', user?.id)
      return token
    },
    async redirect({ url, baseUrl }) {
      console.log('[redirect callback]', url)
      return url.startsWith(baseUrl) ? url : baseUrl
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: true,
}

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
    telegramId?: string
  }
}
