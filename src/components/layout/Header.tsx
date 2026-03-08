// src/components/layout/Header.tsx
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { LuCircleUserRound } from 'react-icons/lu'
import { Button } from '@/components/ui/Button'
import { authOptions } from '@/lib/auth'

export default async function Header() {
  const session = await getServerSession(authOptions)

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Логотип */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          TETA MARKET
        </Link>

        {/* Навигация */}
        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/markets" className="text-gray-700 hover:text-blue-600 text-sm md:text-base">
            Все рынки
          </Link>

          {session ? (
            <>
              {/* Кнопка создания рынка (видна на всех экранах) */}
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/markets/new">Создать рынок</Link>
              </Button>

              {/* Информация о пользователе */}
              <div className="flex items-center gap-2">
                {/* Имя и баланс — только на md и выше */}
                <span className="hidden md:inline text-sm text-gray-600">
                  {session.user.name} ({session.user.balance} кредитов)
                </span>

                {/* Иконка пользователя — всегда видна, ведёт в профиль */}
                <Link href="/profile" aria-label="Профиль">
                  <LuCircleUserRound className="w-6 h-6 text-gray-700 hover:text-blue-600" />
                </Link>
              </div>

              {/* Кнопка выхода (можно скрыть на мобильных, если нужно) */}
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/api/auth/signout">Выйти</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/api/auth/signin">Войти</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
