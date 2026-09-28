import { API_BASE_URL } from '../config/env';
import type {
  AiStatsResponse,
  ChatRequest,
  ChatResponse,
  ConversationSession,
  ConversationSessionDetail,
} from '../models/Ai.model';
import { apiService } from './api.service';
import type { Paginated } from './types';

export const aiService = {
  /** Liste des sessions de conversation de l'utilisateur connecté */
  listSessions: (params = '') =>
    apiService.get<Paginated<ConversationSession>>(`/ai/sessions/${params ? `?${params}` : ''}`),

  /** Récupération d'une session avec son historique complet de messages */
  getSession: (id: string) =>
    apiService.get<ConversationSessionDetail>(`/ai/sessions/${id}/`),

  /** Effacement des messages d'une session sans la supprimer */
  clearSession: (id: string) =>
    apiService.post<ConversationSessionDetail>(`/ai/sessions/${id}/clear/`),

  /** Suppression définitive d'une session */
  deleteSession: (id: string) =>
    apiService.delete<{ detail?: string }>(`/ai/sessions/${id}/`),

  /** Envoi synchrone d'une question à l'assistant IA */
  chat: (data: ChatRequest) =>
    apiService.post<ChatResponse>('/ai/chat/', data),

  /** Métriques globales et statistiques d'utilisation de l'IA */
  stats: () =>
    apiService.get<AiStatsResponse>('/ai/stats/'),

  /**
   * Envoi d'un message avec streaming SSE (Server-Sent Events) mot par mot.
   * Si le streaming échoue ou si le mode mock est activé, bascule automatiquement sur le mode synchrone.
   */
  chatStream: async (
    data: ChatRequest,
    onChunk: (text: string) => void,
    onDone?: (fullText: string) => void,
    onError?: (err: Error) => void
  ): Promise<string> => {
    // Mode Démo / Mock
    if (localStorage.getItem('ent_mock_mode') === 'true') {
      const mockReply =
        `Bonjour ! Je suis l'Assistant IA de l'ENT. ` +
        `Concernant votre demande : « ${data.message} », toutes les plateformes de la suite (Economat, Facturation, etc.) sont opérationnelles. ` +
        `Vous pouvez consulter les guides d'utilisation dans l'onglet Documentation.`;

      const words = mockReply.split(' ');
      let current = '';
      for (const word of words) {
        current += (current ? ' ' : '') + word;
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 40));
      }
      onDone?.(current);
      return current;
    }

    const token = apiService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Fallback en appel synchrone standard
        const fallback = await aiService.chat(data);
        onChunk(fallback.answer);
        onDone?.(fallback.answer);
        return fallback.answer;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Le flux de streaming ne peut pas être lu.');
      }

      const decoder = new TextDecoder();
      let fullText = '';
      let doneReading = false;

      while (!doneReading) {
        const { value, done } = await reader.read();
        if (done) {
          doneReading = true;
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataContent = trimmed.slice(5).trim();
            if (dataContent === '[DONE]') {
              doneReading = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataContent);
              const piece = parsed.chunk || parsed.text || parsed.content || parsed.answer || '';
              if (piece) {
                fullText += piece;
                onChunk(piece);
              }
            } catch {
              // Si le payload SSE est du texte brut
              fullText += dataContent;
              onChunk(dataContent);
            }
          }
        }
      }

      onDone?.(fullText);
      return fullText;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
      throw error;
    }
  },
};
