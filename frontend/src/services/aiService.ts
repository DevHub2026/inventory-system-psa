import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ChatContext {
  current_page?: string;
  current_route?: string;
}

export interface ChatResponseData {
  message: string;
  tool_used: boolean;
  tools_used: string[];
}

export interface ChatApiResponse {
  success: boolean;
  data?: ChatResponseData;
  message?: string;
}

export interface AIModelsResponse {
  active_model: string;
  available_models: string[];
}

export const aiService = {
  chat: async (messages: ChatMessage[], context?: ChatContext): Promise<ChatApiResponse> => {
    const payload = { messages, context };
    const response = await api.post<ChatApiResponse>('/ai/chat', payload);
    return response.data;
  },
  
  getModels: async (): Promise<{ success: boolean; data?: AIModelsResponse; message?: string }> => {
    const response = await api.get('/ai/models');
    return response.data;
  },

  updateModel: async (model: string): Promise<{ success: boolean; data?: { active_model: string }; message?: string }> => {
    const response = await api.put('/ai/settings/model', { model });
    return response.data;
  }
};
