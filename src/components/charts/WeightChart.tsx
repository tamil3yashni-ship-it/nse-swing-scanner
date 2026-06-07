'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts'
import { WeightEntry } from '@/types'

interface WeightChartProps {
  entries: WeightEntry[]
  targetWeight?: number
}

export default function WeightChart({ entries, targetWeight }: WeightChartProps) {
  const data = [...entries].reverse().map(e => ({
    date: e.date,
    weight: e.weight,
    bmi: e.bmi,
  }))

  const minWeight = Math.min(...data.map(d => d.weight)) - 2
  const maxWeight = Math.max(...data.map(d => d.weight)) + 2

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(val) => val.slice(5)}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minWeight, maxWeight]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}kg`}
          />
          <Tooltip
            contentStyle={{
              background: '#1f2937',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
            }}
            formatter={(val: number) => [`${val} kg`, 'Weight']}
          />
          {targetWeight && (
            <ReferenceLine
              y={targetWeight}
              stroke="#22c55e"
              strokeDasharray="6 4"
              label={{ value: `Goal: ${targetWeight}kg`, fill: '#22c55e', fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#weightGradient)"
            dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#ea580c' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
