'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardLayout from '@/components/DashboardLayout'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserProfile } from '@/types'
import StatCard from '@/components/ui/StatCard'
import { Users, Activity, CheckSquare, TrendingDown, MessageCircle, Search, Download, ExternalLink } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays } from 'date-fns'

export default function AdminPage() {
  const { t } = useLanguage()
  const [customers, setCustomers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState({ total: 0, activeToday: 0, totalCheckins: 0, avgLoss: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [checkinActivity, setCheckinActivity] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'))
      const allUsers = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))
      const nonAdmins = allUsers.filter(u => !u.isAdmin)
      setCustomers(nonAdmins)

      const today = new Date().toISOString().split('T')[0]
      const todayCheckinsSnap = await getDocs(query(
        collection(db, 'checkins'),
        where('date', '==', today)
      ))

      const allCheckinsSnap = await getDocs(collection(db, 'checkins'))

      const avgLoss = nonAdmins.reduce((sum, u) => {
        return sum + Math.max(0, (u.startWeight || 0) - (u.currentWeight || 0))
      }, 0) / Math.max(1, nonAdmins.length)

      setStats({
        total: nonAdmins.length,
        activeToday: todayCheckinsSnap.size,
        totalCheckins: allCheckinsSnap.size,
        avgLoss: Math.round(avgLoss * 10) / 10,
      })

      // Build 7-day activity chart
      const activity = await Promise.all(
        Array.from({ length: 7 }).map(async (_, i) => {
          const d = subDays(new Date(), 6 - i)
          const dateStr = d.toISOString().split('T')[0]
          const snap = await getDocs(query(collection(db, 'checkins'), where('date', '==', dateStr)))
          return { date: format(d, 'MM/dd'), count: snap.size }
        })
      )
      setCheckinActivity(activity)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Join Date', 'Start Weight', 'Current Weight', 'Weight Lost', 'Target Weight']
    const rows = filteredCustomers.map(c => [
      c.fullName, c.email, c.phone, c.joinDate,
      c.startWeight, c.currentWeight,
      Math.max(0, (c.startWeight || 0) - (c.currentWeight || 0)).toFixed(1),
      c.targetWeight,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <DashboardLayout title={t('adminTitle')}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t('adminTitle')}</h2>
            <p className="text-gray-500 text-sm mt-1">Manage all customers and track progress</p>
          </div>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 py-2.5">
            <Download className="w-4 h-4" />
            {t('exportData')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t('totalCustomers')} value={stats.total} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100" />
          <StatCard title={t('activeToday')} value={stats.activeToday} icon={Activity} iconColor="text-green-600" iconBg="bg-green-100" />
          <StatCard title={t('totalCheckins')} value={stats.totalCheckins} icon={CheckSquare} iconColor="text-orange-600" iconBg="bg-orange-100" />
          <StatCard title={t('avgWeightLoss')} value={`${stats.avgLoss} kg`} icon={TrendingDown} iconColor="text-purple-600" iconBg="bg-purple-100" />
        </div>

        {/* 7-Day Activity Chart */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Daily Check-in Activity (Last 7 Days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={checkinActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: number) => [val, 'Check-ins']}
                />
                <Bar dataKey="count" name="Check-ins" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-bold text-gray-900">{t('customerList')}</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9 py-2 text-sm w-64"
                placeholder={t('searchCustomer')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="spinner w-8 h-8" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">{search ? 'No customers found' : 'No customers yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">{t('customerName')}</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">{t('customerPhone')}</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 hidden md:table-cell">{t('joinDate')}</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Start</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Current</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">{t('weightLossAdmin')}</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const loss = Math.max(0, (customer.startWeight || 0) - (customer.currentWeight || 0))
                    return (
                      <tr key={customer.uid} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                              {customer.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{customer.fullName}</div>
                              <div className="text-xs text-gray-400">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{customer.phone}</td>
                        <td className="py-3 px-3 text-gray-500 hidden md:table-cell">{customer.joinDate}</td>
                        <td className="py-3 px-3 text-right text-gray-600">{customer.startWeight} kg</td>
                        <td className="py-3 px-3 text-right font-medium text-gray-900">{customer.currentWeight} kg</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-bold ${loss > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {loss > 0 ? `-${loss.toFixed(1)} kg` : '0 kg'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://wa.me/${customer.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${customer.fullName}! This is your Herbalife coach checking in. How are you doing?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3 text-right">{filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
