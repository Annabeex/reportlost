'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type CityOption = { city_ascii: string; state_id: string }

type Props = {
  /** Valeur affichée dans l'input (ex: "Chicago (IL)" ou "Chicago") */
  value: string
  /** Callback principal : renvoie la string à stocker (ex: "Chicago (IL)") */
  onChange: (value: string) => void
  /** Longueur mini avant requête (défaut: 1) */
  minQueryLength?: number
  /** Callback avancé si tu veux l’objet complet sélectionné */
  onSelect?: (city: CityOption) => void
  /** Placeholder */
  placeholder?: string
}

function parseInput(raw: string): { cityPart: string; statePart: string | null } {
  const trimmed = (raw || '').trim()
  // Match "City (ST)" où ST = 2 lettres
  const m = trimmed.match(/^(.*?)(?:\s*\(([A-Za-z]{2})\))?$/)
  if (!m) return { cityPart: trimmed, statePart: null }
  const cityPart = (m[1] || '').trim()
  const statePart = (m[2] || null)?.toUpperCase() ?? null
  return { cityPart, statePart }
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
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  // Garde la valeur contrôlée en phase
  useEffect(() => {
    setSearch(value || '')
  }, [value])

  // Debounce simple
  const debouncedSearch = useMemo(() => {
    let t: any
    return (fn: () => void) => {
      clearTimeout(t)
      t = setTimeout(fn, 200)
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      const { cityPart, statePart } = parseInput(search)
      const q = cityPart

      if (!q || q.length < minQueryLength) {
        setOptions([])
        return
      }
      setLoading(true)

      // Requête : on filtre par prefix de ville, et si statePart est fourni on restreint
      let query = supabase
        .from('us_cities')
        .select('city_ascii, state_id')
        .ilike('city_ascii', `${q}%`)
        .order('city_ascii')
        .limit(10)

      if (statePart) {
        query = query.eq('state_id', statePart)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching cities:', error)
        setOptions([])
      } else {
        setOptions((data || []) as CityOption[])
        setShowSuggestions(true)
      }
      setLoading(false)
      setActiveIndex(-1)
    }

    debouncedSearch(run)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, minQueryLength])

  const pick = (opt: CityOption) => {
    const label = `${opt.city_ascii} (${opt.state_id})`
    setSearch(label)
    onChange(label)     // le formulaire garde une string propre
    onSelect?.(opt)     // bonus : l’objet complet si besoin
    setShowSuggestions(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || options.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + options.length) % options.length)
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < options.length) {
        e.preventDefault()
        pick(options[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="border p-2 rounded w-full"
        onFocus={() => {
          if (search.trim().length >= minQueryLength) setShowSuggestions(true)
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls="city-suggest-list"
      />
      {loading && <div className="absolute right-2 top-2 text-sm text-gray-400">…</div>}

      {showSuggestions && options.length > 0 && (
        <ul
          id="city-suggest-list"
          ref={listRef}
          className="absolute z-10 bg-white border mt-1 w-full max-h-48 overflow-y-auto rounded shadow"
          role="listbox"
        >
          {options.map((opt, idx) => {
            const active = idx === activeIndex
            return (
              <li
                key={`${opt.city_ascii}-${opt.state_id}-${idx}`}
                className={`px-3 py-1 cursor-pointer ${active ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onMouseDown={() => pick(opt)}
                role="option"
                aria-selected={active}
              >
                {opt.city_ascii} ({opt.state_id})
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
