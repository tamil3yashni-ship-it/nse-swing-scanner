'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardLayout from '@/components/DashboardLayout'
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { Photo } from '@/types'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Camera, Upload, X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import Image from 'next/image'

type PhotoType = 'before' | 'after'

export default function PhotosPage() {
  const { userProfile } = useAuth()
  const { t } = useLanguage()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<PhotoType>('before')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photoNotes, setPhotoNotes] = useState('')

  useEffect(() => {
    if (userProfile) loadPhotos()
  }, [userProfile])

  const loadPhotos = async () => {
    if (!userProfile) return
    try {
      const snap = await getDocs(query(
        collection(db, 'photos'),
        where('userId', '==', userProfile.uid),
        orderBy('date', 'desc')
      ))
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!userProfile || !acceptedFiles.length) return
    const file = acceptedFiles[0]

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB allowed.')
      return
    }

    setUploading(true)
    try {
      const filename = `photos/${userProfile.uid}/${Date.now()}_${file.name}`
      const storageRef = ref(storage, filename)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      const photo: Omit<Photo, 'id'> = {
        userId: userProfile.uid,
        type: uploadType,
        url,
        date: new Date().toISOString().split('T')[0],
        notes: photoNotes,
        weight: userProfile.currentWeight,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'photos'), { ...photo, createdAt: serverTimestamp() })
      toast.success(t('photoUploaded'))
      setPhotoNotes('')
      loadPhotos()
    } catch (err) {
      toast.error('Upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }, [userProfile, uploadType, photoNotes, t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    disabled: uploading,
  })

  const beforePhotos = photos.filter(p => p.type === 'before')
  const afterPhotos = photos.filter(p => p.type === 'after')

  return (
    <DashboardLayout title={t('photos')}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('photosTitle')}</h2>
          <p className="text-gray-500 text-sm mt-1">Track your visual transformation journey</p>
        </div>

        {/* Upload Section */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Upload New Photo</h3>

          {/* Type Toggle */}
          <div className="flex gap-3 mb-4">
            {(['before', 'after'] as PhotoType[]).map((type) => (
              <button
                key={type}
                onClick={() => setUploadType(type)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                  uploadType === type
                    ? type === 'before'
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : 'bg-green-50 border-green-400 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {type === 'before' ? '📸 Before Photo' : '✨ After Photo'}
              </button>
            ))}
          </div>

          {/* Notes */}
          <input
            type="text"
            className="input-field mb-4"
            placeholder="Add a note (optional)"
            value={photoNotes}
            onChange={(e) => setPhotoNotes(e.target.value)}
          />

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
            } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="spinner w-8 h-8" />
                <p className="text-gray-500">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">{t('clickUpload')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('supportedFormats')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="spinner w-8 h-8" />
          </div>
        ) : photos.length === 0 ? (
          <div className="card text-center py-14">
            <Camera className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">{t('noPhotos')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Before */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                {t('beforePhotos')} ({beforePhotos.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {beforePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Image src={photo.url} alt="Before" fill className="object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-2">
                      <p className="text-white text-xs">{photo.date}</p>
                      {photo.weight && <p className="text-orange-300 text-xs font-bold">{photo.weight} kg</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                {t('afterPhotos')} ({afterPhotos.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {afterPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Image src={photo.url} alt="After" fill className="object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-2">
                      <p className="text-white text-xs">{photo.date}</p>
                      {photo.weight && <p className="text-green-300 text-xs font-bold">{photo.weight} kg</p>}
                    </div>
                  </div>
                ))}
              </div>
              {afterPhotos.length === 0 && (
                <div className="text-center py-8">
                  <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No after photos yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image src={selectedPhoto.url} alt="Progress photo" fill className="object-cover" />
              </div>
              <div className="mt-3 text-center">
                <span className={`badge text-sm ${selectedPhoto.type === 'before' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {selectedPhoto.type === 'before' ? 'Before' : 'After'}
                </span>
                <p className="text-white text-sm mt-1">{selectedPhoto.date}</p>
                {selectedPhoto.weight && <p className="text-orange-300 font-bold">{selectedPhoto.weight} kg</p>}
                {selectedPhoto.notes && <p className="text-gray-300 text-sm mt-1">{selectedPhoto.notes}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
