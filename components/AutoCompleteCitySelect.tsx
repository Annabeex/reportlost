'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CityOption = { city_ascii: string; state_id: string }

type Props = {
  /** Valeur affichée dans l'input (ex: "Chicago (IL)" ou "Chicago") */
  value: string
  /** Callback principal (rétro-compatible) : on te renvoie la string à stocker */
  onChange: (value: string) => void
  /** (Optionnel) longueur mini avant requête (défaut: 1) */
  minQueryLength?: number
  /** (Optionnel) callback avancé si tu veux récupérer l'objet complet sélectionné */
  onSelect?: (city: CityOption) => void
  /** (Optionnel) placeholder */
  placeholder?: string
}

export default function AutoCompleteCitySelect({
  value,
  onChange,
  minQueryLength = 1,
  onSelect,
  placeholder = 'City (e.g., Chicago or Chicago (IL))',
}: Props) {
  const [options, setOptions] = useState<CityOption[]>([])
  const [search, setSearch] = useState(value || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSearch(value || '')
  }, [value])

  useEffect(() => {
    const fetchCities = async () => {
      const q = search.trim()
      if (q.length < minQueryLength) {
        setOptions([])
        return
      }
      setLoading(true)

      const { data, error } = await supabase
        .from('us_cities')
        .select('city_ascii, state_id')
        .ilike('city_ascii', `${q}%`)
        .order('city_ascii')
        .limit(10)

      if (error) {
        console.error('Error fetching cities:', error)
        setOptions([])
      } else {
        setOptions((data || []) as CityOption[])
        setShowSuggestions(true)
      }
      setLoading(false)
    }

    const t = setTimeout(fetchCities, 200)
    return () => clearTimeout(t)
  }, [search, minQueryLength])

  const pick = (opt: CityOption) => {
    const label = `${opt.city_ascii} (${opt.state_id})`
    setSearch(label)
    onChange(label)       // ✅ le formulaire reste en string
    onSelect?.(opt)       // ✅ bonus : objet complet si besoin
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="border p-2 rounded w-full"
        onFocus={() => {
          if (search.length >= minQueryLength) setShowSuggestions(true)
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {loading && <div className="absolute right-2 top-2 text-sm text-gray-400">...</div>}
      {showSuggestions && options.length > 0 && (
        <ul className="absolute z-10 bg-white border mt-1 w-full max-h-48 overflow-y-auto rounded shadow">
          {options.map((opt) => (
            <li
              key={`${opt.city_ascii}-${opt.state_id}`}
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => pick(opt)}
            >
              {opt.city_ascii} ({opt.state_id})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
