'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { uploadImageAndAnalyze } from '@/lib/Apivision'
import AutoCompleteCitySelect from '@/components/AutoCompleteCitySelect'

const MIN_CITY_CHARS = 1

const AutoCompleteCitySelectWithMinChar = (props: any) => {
  const [inputValue, setInputValue] = useState('')
  return (
    <AutoCompleteCitySelect
      {...props}
      inputValue={inputValue}
      onInputChange={(e: any) => setInputValue(e.target.value)}
      minQueryLength={MIN_CITY_CHARS}
    />
  )
}

type VisionItem = {
  id: string
  image_url: string
  text: string
  upload_location: string
  labels: string
  logos: string
  objects: string
  ocr_text?: string
}

type LocationOption = {
  label: string
  value: string | number
}

export default function FoundItemDashboard() {
  const [items, setItems] = useState<VisionItem[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<LocationOption | null>(null)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [visionData, setVisionData] = useState<{
    imageUrl: string
    labels: string[]
    logos: string[]
    objects: string[]
    ocrText: string
  } | null>(null)
  const [loadingVision, setLoadingVision] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (photo) {
      setLoadingVision(true)
      uploadImageAndAnalyze(photo)
        .then(({ imageUrl, labels, logos, objects, ocrText }) => {
          setDescription(labels?.length ? labels.slice(0, 5).join(', ') : 'Objet trouvé')
          setVisionData({ imageUrl, labels, logos, objects, ocrText })
        })
        .catch((error) => console.error('Erreur analyse vision :', error))
        .finally(() => setLoadingVision(false))
    }
  }, [photo])

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase
      .from('found_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setItems(data as VisionItem[])
  }

  const handleSubmit = async () => {
    if (!photo || !description || !location || !visionData) return

    const { imageUrl, labels, logos, objects, ocrText } = visionData
    const { data: userData } = await supabase.auth.getUser()
    const user_id = userData?.user?.id ?? null

    const safeLocation =
      location && typeof location === 'object' && 'label' in location
        ? location.label
        : ''

    console.log('📤 Données à envoyer :', {
      image_url: imageUrl,
      text: description || ocrText || '',
      ocr_text: ocrText || '',
      upload_location: safeLocation,
      user_id,
      labels: labels.join(', '),
      logos: logos.join(', '),
      objects: objects.join(', '),
    })

    await supabase.from('found_items').insert([
      {
        image_url: imageUrl,
        text: description || ocrText || '',
        ocr_text: ocrText || '',
        upload_location: safeLocation,
        user_id,
        labels: labels.join(', '),
        logos: logos.join(', '),
        objects: objects.join(', '),
      },
    ])

    setPhoto(null)
    setPreview(null)
    setDescription('')
    setLocation(null)
    setVisionData(null)
    setSuccessMessage('Objet ajouté avec succès !')
    fetchItems()
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const filteredItems = items.filter((item) =>
    [item.text, item.upload_location, item.labels]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPhoto(file)
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Objets trouvés – Tableau de bord</h1>

      <div className="bg-white p-4 rounded-xl shadow flex gap-4 items-start">
        <div className="border-dashed border-2 p-4 rounded-lg w-1/3 text-center">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {isClient && preview && (
            <Image
              src={preview}
              alt="Aperçu"
              width={300}
              height={200}
              className="object-cover w-full mt-2 rounded"
              suppressHydrationWarning
            />
          )}
          {loadingVision && <p className="text-sm text-gray-500 mt-2">Analyse en cours...</p>}
        </div>
        <div className="flex flex-col flex-1 gap-3">
          <input
            type="text"
            placeholder="Description (facultatif)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded"
          />
          <AutoCompleteCitySelectWithMinChar
            value={location}
            onChange={(value: LocationOption | null) => setLocation(value)}
          />

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded w-fit"
          >
            Déposer
          </button>

          {successMessage && (
            <p className="text-green-600 text-sm mt-2 font-medium">{successMessage}</p>
          )}

          {visionData && (
            <div className="text-sm text-gray-700 mt-4 space-y-1">
              <div><strong>Labels :</strong> {visionData.labels.join(', ')}</div>
              <div><strong>Logos :</strong> {visionData.logos.join(', ') || '–'}</div>
              <div><strong>Objets :</strong> {visionData.objects.join(', ') || '–'}</div>
              <div><strong>Texte détecté :</strong> {visionData.ocrText || '–'}</div>
            </div>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder="Rechercher (ex: appareil photo, ville...)"
        className="w-full border p-2 rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="border rounded-xl overflow-hidden shadow bg-white">
            {isClient && (
              <Image
                src={item.image_url}
                alt={item.text}
                width={300}
                height={200}
                className="object-cover w-full h-48"
                suppressHydrationWarning
              />
            )}
            <div className="p-3">
              <h3 className="font-bold">{item.text}</h3>
              <p className="text-sm text-gray-600">{item.upload_location}</p>
              {item.ocr_text && (
                <p className="text-xs text-gray-500 italic mt-1">
                  <strong>Texte scanné :</strong> {item.ocr_text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
