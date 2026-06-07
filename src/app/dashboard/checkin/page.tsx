'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardLayout from '@/components/DashboardLayout'
import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DailyCheckin } from '@/types'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { CheckSquare, Droplets, Dumbbell, Moon, Zap, Smile, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface CheckinForm {
  waterIntake: number
  morningShake: boolean
  eveningShake: boolean
  supplementsTaken: boolean
  exerciseDone: boolean
  exerciseMinutes: number
  sleepHours: number
  energyLevel: number
  mood: number
  notes: string
}

const moodEmojis = ['😞', '😕', '😐', '🙂', '😊', '😄', '🤩']
const energyColors = ['bg-red-500', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-yellow-300', 'bg-lime-400', 'bg-green-400', 'bg-green-500', 'bg-emerald-500', 'bg-emerald-600']

export default function CheckinPage() {
  const { userProfile } = useAuth()
  const { t } = useLanguage()
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<DailyCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CheckinForm>({
    defaultValues: {
      waterIntake: 8,
      morningShake: false,
      eveningShake: false,
      supplementsTaken: false,
      exerciseDone: false,
      exerciseMinutes: 30,
      sleepHours: 7,
      energyLevel: 7,
      mood: 5,
      notes: '',
    }
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (userProfile) loadCheckins()
  }, [userProfile])

  const loadCheckins = async () => {
    if (!userProfile) return
    try {
      const snap = await getDocs(query(
        collection(db, 'checkins'),
        where('userId', '==', userProfile.uid),
        orderBy('date', 'desc'),
        limit(7)
      ))
      const checkins = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyCheckin))
      setRecentCheckins(checkins)
      setTodayCheckin(checkins.find(c => c.date === today) || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CheckinForm) => {
    if (!userProfile) return
    setSubmitting(true)
    try {
      const checkin: Omit<DailyCheckin, 'id'> = {
        userId: userProfile.uid,
        date: today,
        waterIntake: Number(data.waterIntake),
        morningShake: data.morningShake,
        eveningShake: data.eveningShake,
        supplementsTaken: data.supplementsTaken,
        exerciseDone: data.exerciseDone,
        exerciseMinutes: data.exerciseDone ? Number(data.exerciseMinutes) : 0,
        sleepHours: Number(data.sleepHours),
        energyLevel: Number(data.energyLevel),
        mood: Number(data.mood),
        notes: data.notes,
        createdAt: new Date().toISOString(),
      }
      await addDoc(collection(db, 'checkins'), { ...checkin, createdAt: serverTimestamp() })
      toast.success(t('checkinSuccess'))
      loadCheckins()
    } catch (err) {
      toast.error('Failed to save check-in')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const exerciseDone = watch('exerciseDone')
  const energyLevel = watch('energyLevel')
  const mood = watch('mood')

  return (
    <DashboardLayout title={t('dailyCheckin')}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('checkinTitle')}</h2>
          <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {todayCheckin ? (
          <div className="card border-2 border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <p className="font-bold text-green-800 text-lg">{t('alreadyCheckin')}</p>
                <p className="text-green-600 text-sm">Great job maintaining your streak!</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-3 text-center">
                <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <div className="font-bold text-gray-900">{todayCheckin.waterIntake}</div>
                <div className="text-xs text-gray-400">Glasses</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <div className="font-bold text-gray-900">{todayCheckin.energyLevel}/10</div>
                <div className="text-xs text-gray-400">Energy</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <Dumbbell className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <div className="font-bold text-gray-900">{todayCheckin.exerciseMinutes}m</div>
                <div className="text-xs text-gray-400">Exercise</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <Moon className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <div className="font-bold text-gray-900">{todayCheckin.sleepHours}h</div>
                <div className="text-xs text-gray-400">Sleep</div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
            {/* Shakes & Supplements */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                🌿 Herbalife Products
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'morningShake' as const, label: t('mealShake1'), icon: '🥤' },
                  { name: 'eveningShake' as const, label: t('mealShake2'), icon: '🥤' },
                  { name: 'supplementsTaken' as const, label: t('supplements'), icon: '💊' },
                ].map(({ name, label, icon }) => (
                  <Controller
                    key={name}
                    name={name}
                    control={control}
                    render={({ field }) => (
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${field.value ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={field.onChange} />
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">{label}</div>
                          <div className="text-xs text-gray-400">{field.value ? 'Done ✓' : 'Tap to mark'}</div>
                        </div>
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Water */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                {t('waterIntake')}
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="15"
                  className="flex-1 accent-blue-500"
                  {...register('waterIntake')}
                />
                <div className="w-16 text-center font-bold text-lg text-blue-600">
                  {watch('waterIntake')} 🥛
                </div>
              </div>
            </div>

            {/* Exercise */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-500" />
                {t('exercise')}
              </h3>
              <Controller
                name="exerciseDone"
                control={control}
                render={({ field }) => (
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${field.value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                    <input type="checkbox" className="sr-only" checked={field.value} onChange={field.onChange} />
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${field.value ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                      {field.value && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-medium text-gray-700">Did you exercise today?</span>
                  </label>
                )}
              />
              {exerciseDone && (
                <div>
                  <label className="label">{t('exerciseMinutes')}</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="30"
                    {...register('exerciseMinutes', { min: 1 })}
                  />
                </div>
              )}
            </div>

            {/* Sleep */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-500" />
                {t('sleepHours')}: <span className="text-purple-600">{watch('sleepHours')}h</span>
              </h3>
              <input
                type="range"
                min="3"
                max="12"
                step="0.5"
                className="w-full accent-purple-500"
                {...register('sleepHours')}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>3h</span><span>12h</span>
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {t('energyLevel')}: <span className="text-yellow-600">{energyLevel}/10</span>
              </h3>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {}}
                    className={`flex-1 h-8 rounded-md transition-all ${Number(energyLevel) > i ? energyColors[i] : 'bg-gray-100'}`}
                  />
                ))}
              </div>
              <input type="range" min="1" max="10" className="w-full accent-yellow-500 mt-2" {...register('energyLevel')} />
            </div>

            {/* Mood */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Smile className="w-5 h-5 text-pink-500" />
                {t('mood')}: <span className="text-2xl">{moodEmojis[Math.min(Math.floor(Number(mood) / 1.5), 6)]}</span>
              </h3>
              <div className="flex justify-between mb-1">
                {moodEmojis.map((emoji, i) => (
                  <span key={i} className={`text-lg transition-all ${Math.round(Number(mood) / 1.5) === i ? 'scale-125' : 'opacity-50'}`}>{emoji}</span>
                ))}
              </div>
              <input type="range" min="1" max="10" className="w-full accent-pink-500" {...register('mood')} />
            </div>

            {/* Notes */}
            <div>
              <label className="label">{t('notes')}</label>
              <textarea
                rows={3}
                className="input-field resize-none"
                placeholder="How are you feeling today? Any challenges?"
                {...register('notes')}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <><div className="spinner w-5 h-5" /> Saving...</> : (
                <><CheckSquare className="w-5 h-5" /> {t('submitCheckin')}</>
              )}
            </button>
          </form>
        )}

        {/* Recent Checkins */}
        {recentCheckins.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Recent Check-ins</h3>
            <div className="space-y-3">
              {recentCheckins.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{c.date}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {c.morningShake && <span className="badge bg-green-100 text-green-700">🥤 Shake</span>}
                      {c.exerciseDone && <span className="badge bg-orange-100 text-orange-700">💪 Exercise</span>}
                      {c.supplementsTaken && <span className="badge bg-purple-100 text-purple-700">💊 Supps</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Energy</div>
                    <div className="font-bold text-orange-600">{c.energyLevel}/10</div>
                    <div className="text-lg">{moodEmojis[Math.min(Math.floor(Number(c.mood) / 1.5), 6)]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
