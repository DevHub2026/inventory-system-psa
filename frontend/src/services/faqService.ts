import { api, unwrapData } from '@/services/api'
import { normalizeFaq, type FAQItem } from '@/help/faq'
import type { ApiResponse } from '@/types'

export interface FaqPayload {
  question: string
  answer: string
  category?: string
  keywords?: string[]
  roles?: string[]
  destination?: string
  destinationRoute?: string
  destinationLabel?: string
  actions?: Array<{ label: string; type: 'route'; target: string }>
  active?: boolean
}

export const faqService = {
  async getFaqs(): Promise<FAQItem[]> {
    const { data } = await api.get<ApiResponse<FAQItem[]>>('/faqs')
    const records = unwrapData(data)
    return records.map(normalizeFaq)
  },

  async createFaq(payload: FaqPayload): Promise<FAQItem> {
    const { data } = await api.post<ApiResponse<FAQItem>>('/faqs', payload)
    return normalizeFaq(unwrapData(data))
  },

  async updateFaq(id: number | string, payload: Partial<FaqPayload>): Promise<FAQItem> {
    const { data } = await api.put<ApiResponse<FAQItem>>(`/faqs/${id}`, payload)
    return normalizeFaq(unwrapData(data))
  },

  async deleteFaq(id: number | string): Promise<void> {
    await api.delete(`/faqs/${id}`)
  },
}
