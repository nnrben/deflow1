// src/app/login/page.tsx 
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import LoginChoice from '@/components/auth/LoginChoice'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/')
  }
  return <LoginChoice />
}
