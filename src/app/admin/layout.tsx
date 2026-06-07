'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (userProfile && !userProfile.isAdmin) {
        router.push('/dashboard')
      }
    }
  }, [user, userProfile, loading, router])

  if (loading) return <LoadingScreen />
  if (!user || (userProfile && !userProfile.isAdmin)) return null

  return <>{children}</>
}
