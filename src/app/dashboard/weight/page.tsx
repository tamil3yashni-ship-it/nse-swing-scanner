'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardLayout from '@/components/DashboardLayout'
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { WeightEntry } from '@/types'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Scale, Plus, TrendingDown, Activity } from 'lucide-react'
import WeightChart from '@/components/charts/WeightChart'

interface WeightForm {
  weight: number
  date: string
  notes: string
}

export default function WeightPage() {
  const { userProfile, refreshProfile } = useAuth()
  const { t } = useLanguage()
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WeightForm>({
    defaultValues: { date: new Date().toISOString().split('T')[0] }
  })

  useEffect(() => {
    if (userProfile) loadEntries()
  }, [userProfile])

  const loadEntries = async () => {
    if (!userProfile) return
    try {
      const snap = await getDocs(query(
        collection(db, 'weights'),
        where('userId', '==', userProfile.uid),
        orderBy('date', 'desc')
      ))
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateBMI = (weight: number) => {
    if (!userProfile?.height) return 0
    const heightM = userProfile.height / 100
    return Math.round((weight / (heightM * heightM)) * 10) / 10
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' }
    if (bmi < 25) return { label: t('bmiNormal'), color: 'text-green-600' }
    if (bmi < 30) return { label: t('bmiOverweight'), color: 'text-yellow-600' }
    return { label: t('bmiObese'), color: 'text-red-600' }
  }

  const onSubmit = async (data: WeightForm) => {
    if (!userProfile) return
    setSubmitting(true)
    try {
      const bmi = calculateBMI(Number(data.weight))
      const entry: Omit<WeightEntry, 'id'> = {
        userId: userProfile.uid,
        weight: Number(data.weight),
        date: data.date,
        notes: data.notes,
        bmi,
        createdAt: new Date().toISOString(),
      }
      await addDoc(collection(db, 'weights'), { ...entry, createdAt: serverTimestamp() })

      // Update user's current weight
      await updateDoc(doc(db, 'users', userProfile.uid), { currentWeight: Number(data.weight) })
      await refreshProfile()

      toast.success('Weight logged successfully!')
      reset({ date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      loadEntries()
    } catch (err) {
      toast.error('Failed to save weight')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const latestWeight = entries[0]?.weight || userProfile?.currentWeight || 0
  const bmi = calculateBMI(latestWeight)
  const bmiInfo = getBMICategory(bmi)
  const weightLost = Math.max(0, (userProfile?.startWeight || 0) - latestWeight)

  return (
    <DashboardLayout title={t('weightTracking')}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t('weightTracking')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('weightHistory')}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2 py-2.5"
          >
            <Plus className="w-4 h-4" />
            {t('addWeight')}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <Scale className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{latestWeight} kg</div>
            <div className="text-xs text-gray-500">{t('currentWeightLabel')}</div>
          </div>
          <div className="card text-center">
            <TrendingDown className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{weightLost.toFixed(1)} kg</div>
            <div className="text-xs text-gray-500">{t('weightLost')}</div>
          </div>
          <div className="card text-center">
            <Activity className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${bmiInfo.color}`}>{bmi}</div>
            <div className={`text-xs font-medium ${bmiInfo.color}`}>{bmiInfo.label}</div>
          </div>
        </div>

        {/* Add Weight Form */}
        {showForm && (
          <div className="card border-2 border-orange-200 animate-slide-up">
            <h3 className="font-bold text-gray-900 mb-4">{t('addWeight')}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('weightValue')}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="72.5"
                    {...register('weight', {
                      required: t('required'),
                      min: { value: 20, message: 'Min 20kg' },
                      max: { value: 300, message: 'Max 300kg' }
                    })}
                  />
                  {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>}
                </div>
                <div>
                  <label className="label">{t('weightDate')}</label>
                  <input
                    type="date"
                    className="input-field"
                    max={new Date().toISOString().split('T')[0]}
                    {...register('date', { required: t('required') })}
                  />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                </div>
              </div>
              <div>
                <label className="label">{t('weightNotes')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="How do you feel today?"
                  {...register('notes')}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
                  {submitting ? t('loading') : t('saveWeight')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Chart */}
        {entries.length > 1 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">{t('weightTrend')}</h3>
            <WeightChart entries={entries} targetWeight={userProfile?.targetWeight} />
          </div>
        )}

        {/* History Table */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">{t('weightHistory')}</h3>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="spinner w-8 h-8" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10">
              <Scale className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">{t('noWeightData')}</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 py-2">
                {t('addWeight')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">{t('weightDate')}</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">{t('weightValue')}</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">{t('bmi')}</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Change</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">{t('weightNotes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => {
                    const prev = entries[idx + 1]
                    const change = prev ? entry.weight - prev.weight : null
                    const bmiVal = entry.bmi || calculateBMI(entry.weight)
                    const bmiCat = getBMICategory(bmiVal)
                    return (
                      <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-600">{entry.date}</td>
                        <td className="py-3 px-2 text-right font-bold text-gray-900">{entry.weight} kg</td>
                        <td className={`py-3 px-2 text-right font-medium ${bmiCat.color}`}>{bmiVal}</td>
                        <td className="py-3 px-2 text-right">
                          {change !== null && (
                            <span className={`font-medium ${change < 0 ? 'text-green-600' : change > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-gray-400 truncate max-w-[150px]">{entry.notes || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
