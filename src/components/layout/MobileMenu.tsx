// src/components/layout/MobileMenu.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GrChat } from 'react-icons/gr'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import { Button } from '@/components/ui/Button'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  session: Session | null
}

export default function MobileMenu({ isOpen, onClose, session }: MobileMenuProps) {
  const [openSubmenu, setOpenSubmenu] = useState<null | 'company' | 'academy'>(null)

  const toggleSubmenu = (menu: 'company' | 'academy') => {
    setOpenSubmenu(prev => (prev === menu ? null : menu))
  }

  const handleLinkClick = () => {
    onClose()
    setOpenSubmenu(null)
  }

  const submenuLinkClass =
    'block w-full text-left text-gray-700 py-2 px-6 hover:bg-gray-100 transition-colors cursor-pointer'

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-full h-full bg-white z-40 transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="flex flex-col pt-[80px] pb-10 w-full max-w-md mx-auto">
          {session && (
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="font-semibold text-gray-800">{session.user.name}</p>
              <p className="text-sm text-gray-600">Баланс: {session.user.balance} кредитов</p>
              <Link
                href="/profile"
                className="text-blue-600 text-sm mt-1 inline-block"
                onClick={handleLinkClick}
              >
                Личный кабинет →
              </Link>
            </div>
          )}

          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSubmenu('company')}
              className="w-full flex justify-between items-center px-6 py-4 text-xl font-semibold text-gray-800"
            >
              <span>Компания</span>
              {openSubmenu === 'company' ? (
                <IoIosArrowUp className="text-gray-600" />
              ) : (
                <IoIosArrowDown className="text-gray-600" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {openSubmenu === 'company' && (
                <motion.div
                  key="company"
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="bg-gray-50 overflow-hidden"
                >
                  <Link
                    href="#"
                    className={submenuLinkClass}
                    onClick={handleLinkClick}
                  >
                    О нас
                  </Link>
                  <Link
                    href="#"
                    className={submenuLinkClass}
                    onClick={handleLinkClick}
                  >
                    Безопасность
                  </Link>
                  <Link
                    href="#"
                    className={submenuLinkClass}
                    onClick={handleLinkClick}
                  >
                    Партнерская команда
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSubmenu('academy')}
              className="w-full flex justify-between items-center px-6 py-4 text-xl font-semibold text-gray-800"
            >
              <span>Академия</span>
              {openSubmenu === 'academy' ? (
                <IoIosArrowUp className="text-gray-600" />
              ) : (
                <IoIosArrowDown className="text-gray-600" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {openSubmenu === 'academy' && (
                <motion.div
                  key="academy"
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="bg-gray-50 overflow-hidden"
                >
                  <Link
                    href="#"
                    className={submenuLinkClass}
                    onClick={handleLinkClick}
                  >
                    База знаний
                  </Link>
                  <Link
                    href="#"
                    className={submenuLinkClass}
                    onClick={handleLinkClick}
                  >
                    Блог
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          <div className="pt-6 space-y-4 w-full flex flex-col items-center">
            {!session ? (
              <>
                <button
                  onClick={() => {
                    handleLinkClick()
                    window.location.href = 'https://deflow.ru'
                  }}
                  className="w-[90%] py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold text-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Попробовать бесплатно
                </button>

                <Button asChild size="lg" className="w-[90%] text-xl py-3">
                  <Link href="/login" onClick={handleLinkClick}>
                    Войти
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-[90%] text-xl py-3"
                onClick={() => {
                  handleLinkClick()
                  signOut({ callbackUrl: '/' })
                }}
              >
                Выйти
              </Button>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <button
          onClick={() => {
            window.open('https://t.me/deflow_support_bot?start=1', '_blank')
          }}
          className="fixed bottom-6 right-6 z-50 bg-blue-100 text-blue-700 rounded-full p-4 shadow-lg hover:scale-105 hover:bg-blue-200 transition-transform duration-300"
          aria-label="Поддержка в Telegram"
        >
          <GrChat className="w-6 h-6" />
        </button>
      )}
    </>
  )
}

