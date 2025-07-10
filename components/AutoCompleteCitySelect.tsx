'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function AutoCompleteCitySelect({ value, onChange }: Props) {
  const [cities, setCities] = useState<string[]>([])
  const [search, setSearch] = useState(value || '') // ✅ initialize search with value
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    setSearch(value || '') // ✅ update search when prop changes (if needed)
  }, [value])

  useEffect(() => {
    const fetchCities = async () => {
      if (search.length < 1) {
        setCities([])
        return
      }

      const { data, error } = await supabase
        .from('us_cities')
        .select('city_ascii, state_id')
        .ilike('city_ascii', `${search}%`)
        .limit(10)

      if (data) {
        const cityNames = data.map((row) => `${row.city_ascii} (${row.state_id})`)
        setCities(cityNames)
        setShowSuggestions(true)
      }
    }

    const timeout = setTimeout(fetchCities, 200)
    return () => clearTimeout(timeout)
  }, [search])

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          onChange(e.target.value) // informe le parent
        }}
        placeholder="City or ZIP code"
        className="border p-2 rounded w-full"
        onFocus={() => {
          if (search.length >= 1) setShowSuggestions(true)
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {showSuggestions && cities.length > 0 && (
        <ul className="absolute z-10 bg-white border mt-1 w-full max-h-48 overflow-y-auto rounded shadow">
          {cities.map((city) => (
            <li
              key={city}
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => {
                setSearch(city)
                onChange(city)
                setShowSuggestions(false)
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
