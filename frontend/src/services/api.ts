import axios from 'axios'
import type { ApiResponse } from '@/types'

/** Set VITE_USE_MOCK=true to force mocks. Default: try real API, then mock. */
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prototype_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function isMockMode(): boolean {
  return FORCE_MOCK
}

export async function withMockFallback<T>(
  request: () => Promise<T>,
  mock: () => T | Promise<T>,
): Promise<T> {
  if (FORCE_MOCK) {
    return mock()
  }

  try {
    return await request()
  } catch {
    return mock()
  }
}

export function unwrapData<T>(payload: ApiResponse<T>): T {
  return payload.data
}
