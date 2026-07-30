export interface IssuanceUserSummary {
  id: number
  employee_number?: string | null
  full_name?: string
  email?: string
  department?: { id: number; name: string } | null
  office?: { id: number; name: string } | null
  roles?: Array<{ id: number; name: string }>
  permanent_issuance_count?: number
  latest_issuance_date?: string | null
}

export interface PermanentIssuanceAsset {
  asset_id: number
  asset_number: string
  property_number?: string | null
  asset_name: string
  asset_code?: string | null
  category?: string | null
  office?: string | null
  location?: string | null
  date_issued?: string | null
  issued_by?: string | null
  issued_by_user_id?: number | null
  issued_to_user_id?: number | null
  issued_to?: string | null
  is_unlinked_holder?: boolean
  issuance_status?: string
  asset_status?: string
  accountable_user?: IssuanceUserSummary | null
}

export interface PermanentIssuanceDirectoryFilters {
  search?: string
  office_id?: number
  department_id?: number
  has_issuances?: boolean
  per_page?: number
  page?: number
}

export interface PermanentIssuanceUserAssetsFilters {
  search?: string
  asset_category_id?: number
  office_id?: number
  date_issued_from?: string
  date_issued_to?: string
  include_history?: boolean
}

export interface IssuanceUserSearchFilters {
  search?: string
  office_id?: number
  department_id?: number
  per_page?: number
}
