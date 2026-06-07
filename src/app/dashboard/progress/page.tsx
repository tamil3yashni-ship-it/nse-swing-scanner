'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardLayout from '@/components/DashboardLayout'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { WeightEntry, DailyCheckin } from '@/types'
import WeightChart from '@/components/charts/WeightChart'
import { CheckinChart } from '@/components/charts/CheckinChart'
import {
  TrendingDown,
  Award,
  Target,
  Flame,
  Share2,
  MessageCircle,
  CheckCircle,
  Calendar,
} from 'lucide-react'
import { differenceInDays, parseISO, format, subDays } from 'date-fns'

const BADGES = [
  { id: 'first_checkin', icon: '🎯', label: 'First Check-in', desc: 'Completed your first daily check-in', condition: (c: number) => c >= 1 },
  { id: 'week_streak', icon: '🔥', label: '7-Day Streak', desc: 'Checked in 7 days in a row', condition: (_c: number, streak: number) => streak >= 7 },
  { id: 'month_streak', icon: '💪', label: '30-Day Warrior', desc: '30 consecutive check-ins', condition: (_c: number, streak: number) => streak >= 30 },
  { id: 'first_kg', icon: '⚖️', label: 'First KG Lost', desc: 'Lost your first kilogram', condition: (_c: number, _s: number, loss: number) => loss >= 1 },
  { id: 'five_kg', icon: '🏆', label: '5 KG Champion', desc: 'Lost 5 kilograms total', condition: (_c: number, _s: number, loss: number) => loss >= 5 },
  { id: 'ten_kg', icon: '👑', label: '10 KG Legend', desc: 'Lost 10 kilograms total', condition: (_c: number, _s: number, loss: number) => loss >= 10 },
]

export default function ProgressPage() {
  const { userProfile } = useAuth()
  const { t } = useLanguage()
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [checkins, setCheckins] = useState<DailyCheckin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) loadData()
  }, [userProfile])

  const loadData = async () => {
    if (!userProfile) return
    try {
      const [weightsSnap, checkinsSnap] = await Promise.all([
        getDocs(query(collection(db, 'weights'), where('userId', '==', userProfile.uid), orderBy('date', 'asc'))),
        getDocs(query(collection(db, 'checkins'), where('userId', '==', userProfile.uid), orderBy('date', 'desc'))),
      ])
      setWeightEntries(weightsSnap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry)))
      setCheckins(checkinsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DailyCheckin)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const weightLost = Math.max(0, (userProfile?.startWeight || 0) - (userProfile?.currentWeight || 0))
  const remainingToGoal = Math.max(0, (userProfile?.currentWeight || 0) - (userProfile?.targetWeight || 0))
  const progressPercent = userProfile
    ? Math.min(100, Math.round((weightLost / Math.max(1, userProfile.startWeight - userProfile.targetWeight)) * 100))
    : 0

  const daysActive = userProfile?.joinDate
    ? differenceInDays(new Date(), parseISO(userProfile.joinDate)) + 1
    : 0

  // Calculate streak
  const checkinStreak = (() => {
    if (!checkins.length) return 0
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const d = subDays(today, i)
      const dateStr = d.toISOString().split('T')[0]
      if (checkins.some(c => c.date === dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  })()

  const earnedBadges = BADGES.filter(b => b.condition(checkins.length, checkinStreak, weightLost))

  const shareText = `I've lost ${weightLost.toFixed(1)}kg on my Herbalife journey! 🌿 ${progressPercent}% towards my goal. Join me! #HerbaCoach #WeightLoss`

  const weeklyCheckinData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i)
    const dateStr = d.toISOString().split('T')[0]
    const checkin = checkins.find(c => c.date === dateStr)
    return {
      day: format(d, 'EEE'),
      date: dateStr,
      checked: !!checkin,
      energy: checkin?.energyLevel || 0,
      water: checkin?.waterIntake || 0,
    }
  })

  return (
    <DashboardLayout title={t('progress')}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t('progressTitle')}</h2>
            <p className="text-gray-500 text-sm mt-1">Your complete transformation story</p>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-green flex items-center gap-2 py-2.5"
          >
            <Share2 className="w-4 h-4" />
            {t('shareProgress')}
          </a>
        </div>

        {/* Goal Progress Card */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Goal Progress</h3>
              <p className="text-orange-600 text-sm">{remainingToGoal.toFixed(1)} kg to go!</p>
            </div>
            <div className="text-4xl font-extrabold text-orange-600">{progressPercent}%</div>
          </div>
          <div className="relative w-full bg-orange-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-orange-600 mt-2">
            <span>Start: {userProfile?.startWeight} kg</span>
            <span>Now: {userProfile?.currentWeight} kg</span>
            <span>Goal: {userProfile?.targetWeight} kg</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: TrendingDown, label: t('totalLoss'), value: `${weightLost.toFixed(1)} kg`, color: 'text-green-600', bg: 'bg-green-100' },
            { icon: Flame, label: t('checkinStreak'), value: `${checkinStreak} days`, color: 'text-red-600', bg: 'bg-red-100' },
            { icon: Calendar, label: t('daysActive'), value: `${daysActive} days`, color: 'text-blue-600', bg: 'bg-blue-100' },
            { icon: Target, label: 'Total Check-ins', value: checkins.length, color: 'text-purple-600', bg: 'bg-purple-100' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="stat-card text-center">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Weight Chart */}
        {weightEntries.length > 1 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">{t('weightTrend')}</h3>
            <WeightChart entries={[...weightEntries].reverse()} targetWeight={userProfile?.targetWeight} />
          </div>
        )}

        {/* Weekly Activity */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">This Week&apos;s Check-ins</h3>
          <div className="grid grid-cols-7 gap-2">
            {weeklyCheckinData.map((day) => (
              <div key={day.date} className="text-center">
                <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${day.checked ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {day.checked ? <CheckCircle className="w-5 h-5" /> : <span className="text-xs">{day.day}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1">{day.day}</div>
                {day.checked && day.energy > 0 && (
                  <div className="text-xs text-orange-600 font-medium mt-0.5">{day.energy}/10</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            {t('achievementBadges')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGES.map((badge) => {
              const earned = badge.condition(checkins.length, checkinStreak, weightLost)
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border-2 transition-all ${earned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{badge.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{badge.desc}</div>
                  {earned && <div className="text-xs text-yellow-600 font-medium mt-1">✓ Earned!</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* WhatsApp Share */}
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '+919876543210'}?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-center gap-4 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-800">Share with your coach</p>
            <p className="text-sm text-green-600">Send your progress report via WhatsApp</p>
          </div>
        </a>
      </div>
    </DashboardLayout>
  )
}
