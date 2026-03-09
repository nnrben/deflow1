// src/components/layout/HeaderContent.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Session } from 'next-auth'
import DesktopNav from './DesktopNav'
import MobileMenu from './MobileMenu'

export default function HeaderContent({ session }: { session: Session | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${
          scrolled || mobileMenuOpen
            ? 'bg-white/90 backdrop-blur-sm shadow-md'
            : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-black select-none">
            DEFLOW
          </Link>

          {/* Desktop navigation (hidden on mobile) */}
          <div className="hidden md:block">
            <DesktopNav session={session} />
          </div>

          {/* Mobile menu button (visible on mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 flex flex-col items-center justify-center space-y-1 p-2 rounded-md"
            aria-label="Открыть меню"
            aria-expanded={mobileMenuOpen}
          >
            <div
              className={`w-6 h-0.5 bg-gray-700 transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <div
              className={`w-6 h-0.5 bg-gray-700 transition-opacity duration-300 ${
                mobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <div
              className={`w-6 h-0.5 bg-gray-700 transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        session={session}
      />
    </>
  )

}
