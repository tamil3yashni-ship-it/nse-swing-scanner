'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardLayout from '@/components/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { WeightEntry, DailyCheckin } from '@/types'
import Link from 'next/link'
import {
  Scale,
  CheckSquare,
  Camera,
  TrendingDown,
  MessageCircle,
  Calendar,
  Flame,
  Target,
} from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const { t } = useLanguage()
  const [recentWeights, setRecentWeights] = useState<WeightEntry[]>([])
  const [recentCheckins, setRecentCheckins] = useState<DailyCheckin[]>([])
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile) return
    loadDashboardData()
  }, [userProfile])

  const loadDashboardData = async () => {
    if (!userProfile) return
    try {
      const today = new Date().toISOString().split('T')[0]

      const [weightsSnap, checkinsSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'weights'),
          where('userId', '==', userProfile.uid),
          orderBy('date', 'desc'),
          limit(7)
        )),
        getDocs(query(
          collection(db, 'checkins'),
          where('userId', '==', userProfile.uid),
          orderBy('date', 'desc'),
          limit(7)
        )),
      ])

      const weights = weightsSnap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry))
      const checkins = checkinsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DailyCheckin))

      setRecentWeights(weights)
      setRecentCheckins(checkins)
      setTodayCheckin(checkins.find(c => c.date === today) || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const weightLost = userProfile
    ? Math.max(0, userProfile.startWeight - userProfile.currentWeight)
    : 0

  const daysActive = userProfile?.joinDate
    ? differenceInDays(new Date(), parseISO(userProfile.joinDate)) + 1
    : 0

  const checkinStreak = (() => {
    if (!recentCheckins.length) return 0
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (recentCheckins.some(c => c.date === dateStr)) {
        streak++
      } else {
        break
      }
    }
    return streak
  })()

  const progressPercent = userProfile
    ? Math.min(100, Math.round((weightLost / Math.max(1, userProfile.startWeight - userProfile.targetWeight)) * 100))
    : 0

  return (
    <DashboardLayout title={t('dashboard')}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {t('welcomeBack')}, {userProfile?.fullName?.split(' ')[0]} 👋
              </h2>
              <p className="text-orange-100 mt-1 text-sm">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
              {!todayCheckin && (
                <Link
                  href="/dashboard/checkin"
                  className="mt-4 inline-flex items-center gap-2 bg-white text-orange-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  {t('doCheckin')}
                </Link>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{progressPercent}%</div>
              <div className="text-orange-100 text-xs">Goal Progress</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-orange-100 mb-1">
              <span>{userProfile?.startWeight} kg</span>
              <span>Goal: {userProfile?.targetWeight} kg</span>
            </div>
            <div className="w-full bg-orange-400/40 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('currentWeightLabel')}
            value={`${userProfile?.currentWeight || 0} kg`}
            subtitle="Current"
            icon={Scale}
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
          />
          <StatCard
            title={t('weightLost')}
            value={`${weightLost.toFixed(1)} kg`}
            subtitle={`Started at ${userProfile?.startWeight}kg`}
            icon={TrendingDown}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <StatCard
            title={t('daysActive')}
            value={daysActive}
            subtitle={`Since ${userProfile?.joinDate}`}
            icon={Calendar}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatCard
            title={t('checkinStreak')}
            value={`${checkinStreak} ${t('daysCheckin')}`}
            subtitle="Keep it up!"
            icon={Flame}
            iconColor="text-red-600"
            iconBg="bg-red-100"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { href: '/dashboard/weight', icon: Scale, label: t('logWeight'), color: 'orange' },
              { href: '/dashboard/checkin', icon: CheckSquare, label: t('doCheckin'), color: 'green', disabled: !!todayCheckin },
              { href: '/dashboard/photos', icon: Camera, label: t('uploadPhoto'), color: 'blue' },
              { href: '/dashboard/progress', icon: TrendingDown, label: t('viewProgress'), color: 'purple' },
            ].map(({ href, icon: Icon, label, color, disabled }) => (
              <Link
                key={href}
                href={href}
                className={`card-hover flex flex-col items-center gap-3 p-5 text-center transition-all ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
                {disabled && <span className="text-xs text-gray-400">Done today ✓</span>}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Recent Weights */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{t('weightHistory')}</h3>
              <Link href="/dashboard/weight" className="text-xs text-orange-600 font-medium hover:underline">View all</Link>
            </div>
            {recentWeights.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">{t('noWeightData')}</p>
            ) : (
              <div className="space-y-2">
                {recentWeights.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{w.date}</span>
                    <span className="font-semibold text-gray-900">{w.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Checkins */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{t('recentActivity')}</h3>
              <Link href="/dashboard/checkin" className="text-xs text-orange-600 font-medium hover:underline">View all</Link>
            </div>
            {recentCheckins.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No check-ins yet</p>
            ) : (
              <div className="space-y-2">
                {recentCheckins.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-500">{c.date}</span>
                      <div className="flex gap-1 mt-0.5">
                        {c.morningShake && <span className="badge bg-green-100 text-green-700">Shake ✓</span>}
                        {c.exerciseDone && <span className="badge bg-blue-100 text-blue-700">Exercise ✓</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Energy</div>
                      <div className="font-semibold text-orange-600">{c.energyLevel}/10</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '+919876543210'}?text=${encodeURIComponent(t('whatsappMessage'))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-center gap-4 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-800">{t('whatsappCoach')}</p>
            <p className="text-sm text-green-600">Get instant support and motivation</p>
          </div>
          <Target className="w-5 h-5 text-green-500 ml-auto" />
        </a>
      </div>
    </DashboardLayout>
  )
}
