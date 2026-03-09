// src/components/layout/DesktopNav.tsx
'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import { Button } from '@/components/ui/Button'
import { LuCircleUserRound } from 'react-icons/lu'

export default function DesktopNav({ session }: { session: Session | null }) {
  return (
    <nav className="flex items-center gap-2 md:gap-4">


      {session ? (
        <>


          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-sm text-gray-600">
              {session.user.name} ({session.user.balance} кредитов)
            </span>
            <Link href="/profile" aria-label="Профиль">
              <LuCircleUserRound className="w-6 h-6 text-gray-700 hover:text-blue-600" />
            </Link>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Выйти
          </Button>
        </>
      ) : (
        <Button asChild size="sm">
          <Link href="/login">Войти</Link>
        </Button>
      )}
    </nav>
  )
}


