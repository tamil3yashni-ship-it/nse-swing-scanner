import { Leaf } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <div className="spinner w-8 h-8 mx-auto" />
        <p className="mt-4 text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  )
}
