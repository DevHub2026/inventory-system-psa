import { useEffect, useRef, useState } from 'react'
import { Input, Spinner } from '@/components/ui'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { IssuanceUserSummary } from '@/types/permanentIssuance'

function formatUserSecondary(user: IssuanceUserSummary): string {
  const parts = [
    user.employee_number,
    user.roles?.[0]?.name,
    user.department?.name,
    user.office?.name,
  ].filter(Boolean)

  return parts.join(' · ')
}

interface IssuanceUserSearchSelectProps {
  value: number | null
  onChange: (userId: number | null, user: IssuanceUserSummary | null) => void
  disabled?: boolean
  placeholder?: string
  initialUser?: IssuanceUserSummary | null
}

export function IssuanceUserSearchSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Search employee by name, number, email, department, or office…',
  initialUser = null,
}: IssuanceUserSearchSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<IssuanceUserSummary[]>([])
  const [selected, setSelected] = useState<IssuanceUserSummary | null>(initialUser)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setSelected(initialUser ?? null)
  }, [initialUser])

  useEffect(() => {
    if (!value) {
      setSelected(null)
    }
  }, [value])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!open) return

    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const result = await permanentIssuanceService.searchUsers({
          search: query || undefined,
          per_page: 30,
        })
        setUsers(result.items)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, open])

  const handleSelect = (user: IssuanceUserSummary) => {
    setSelected(user)
    setQuery('')
    setOpen(false)
    onChange(user.id, user)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    onChange(null, null)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-[13px] font-medium text-[#1F2937]">Issued To</label>

      {(selected ?? initialUser) && value ? (
        <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[#0F172A]">{(selected ?? initialUser)?.full_name}</p>
              <p className="mt-1 text-[12px] text-[#64748B]">{formatUserSecondary((selected ?? initialUser)!)}</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[12px] font-medium text-[#DC2626] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
          />
          {open && (
            <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-[10px] border border-[#E5E7EB] bg-white shadow-lg">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner />
                </div>
              ) : users.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-[#94A3B8]">No matching employees found.</p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="block w-full border-b border-[#F1F5F9] px-3 py-3 text-left hover:bg-[#F8FAFC]"
                  >
                    <p className="text-[14px] font-medium text-[#0F172A]">{user.full_name}</p>
                    <p className="mt-0.5 text-[12px] text-[#64748B]">{formatUserSecondary(user)}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
