import axios, { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

/** Set VITE_USE_MOCK=true to force mocks. Default: use the real API and surface errors. */
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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status
    const backendMessage = error.response?.data?.message
    const validationErrors = error.response?.data?.errors

    if (status === 422) {
      const firstValidationMessage = validationErrors ? Object.values(validationErrors).flat()[0] : null
      return Promise.reject(new Error(firstValidationMessage || 'Please check the highlighted fields and try again.'))
    }

    if (status === 401) {
      return Promise.reject(new Error('Your session has expired. Please sign in again.'))
    }

    if (status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'))
    }

    if (status === 404) {
      return Promise.reject(new Error('The requested item could not be found.'))
    }

    if (status && status >= 500) {
      return Promise.reject(new Error('The server could not complete the request. Please try again.'))
    }

    return Promise.reject(new Error(backendMessage || error.message || 'Unable to connect to the server.'))
  },
)

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

  return request()
}

export function unwrapData<T>(payload: ApiResponse<T>): T {
  return payload.data
}
