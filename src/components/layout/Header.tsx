// src/components/layout/Header.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import HeaderContent from './HeaderContent'

export default async function Header() {
  const session = await getServerSession(authOptions)
  return <HeaderContent session={session} />
}